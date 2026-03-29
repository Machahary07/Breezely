import { Injectable } from '@angular/core';
import { db, auth } from '../../firebaseConfig';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, serverTimestamp, query, orderBy, writeBatch } from 'firebase/firestore';

export interface Complaint {
  id?: string;
  source: string;
  customerName: string;
  customerId: string;
  message: string;
  timestamp: any;
  status: 'Open' | 'In Progress' | 'Resolved';
  platform: string;
}

export interface CustomerHistory {
  id?: string;
  name: string;
  email: string;
  complaintHistory: string[];
}

export interface FlowConfig {
  id?: string;
  name: string;
  description: string;
  useCase: string;
  status: 'Active' | 'Not configured' | 'Marketplace';
  configJson: string;
  userId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FlowsService {

  // Fetch API Key from Firestore
  async getGeminiApiKey(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    const docRef = doc(db, 'users', user.uid, 'settings', 'credentials');
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()['gemini']) {
      return snap.data()['gemini'].key;
    }
    return null;
  }

  // Generate Suggested Reply
  async generateSuggestedReply(complaint: Complaint, customerHistoryCount: number): Promise<string> {
    const key = await this.getGeminiApiKey();
    if (!key) throw new Error('Gemini API Key not configured.');

    const prompt = `You are an expert customer service AI.
Write a professional, empathetic reply to this customer complaint.
Customer Name: ${complaint.customerName}
Platform: ${complaint.platform}
Complaint: ${complaint.message}
History Context: The customer has ${customerHistoryCount} total past complaints on record.

Keep the reply concise, helpful, and matching the tone appropriate for ${complaint.platform}. Do not include placeholders like [Your Name]. Just give the direct reply text.`;

    return this.callGeminiBase(prompt, key);
  }

  // Context-Aware Chat
  async chatWithAssistant(prompt: string, currentDraft: string, complaint: Complaint): Promise<string> {
    const key = await this.getGeminiApiKey();
    if (!key) throw new Error('Gemini API Key not configured.');

    const fullPrompt = `You are a helpful AI assistant for a customer service agent.
Context:
Customer: ${complaint.customerName} (${complaint.platform})
Message: ${complaint.message}
Current Reply Draft: "${currentDraft}"

Agent Request: ${prompt}

Based on the agent's request, provide ONLY the updated reply draft text. Do not provide commentary or quotation marks around the final text.`;

    return this.callGeminiBase(fullPrompt, key);
  }

  // Generate Flow Config
  async generateFlowConfig(prompt: string): Promise<string> {
    const key = await this.getGeminiApiKey();
    if (!key) throw new Error('Gemini API Key not configured.');

    const fullPrompt = `You are an expert AI software architect. 
Please generate a JSON configuration for a new automation Flow based on the user's description.
User description: ${prompt}

Return ONLY valid JSON with this structure:
{
  "name": "Flow Name",
  "description": "Short description",
  "triggers": [{"type": "Trigger Type"}],
  "actions": [{"type": "Action Type", "details": "..."}],
  "uiLayout": ["Panel", "Map", "Table", "Etc"]
}
Do not include \`\`\`json or \`\`\` formatting blocks, just the raw JSON text.`;

    const responseText = await this.callGeminiBase(fullPrompt, key);
    return responseText.replace(/```json/g, '').replace(/```/g, '').trim();
  }

  // Base Gemini Call
  private async callGeminiBase(prompt: string, key: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Gemini API Error');
    }
    const data = await response.json();
    if (data.candidates && data.candidates[0].content.parts.length > 0) {
      return data.candidates[0].content.parts[0].text;
    }
    return '';
  }

  // Database operations
  
  async getComplaints(): Promise<Complaint[]> {
    const complaintsRef = collection(db, 'complaints');
    const qSnapshot = await getDocs(query(complaintsRef, orderBy('timestamp', 'desc')));
    return qSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint));
  }
  
  async getCustomerHistoryCount(customerId: string): Promise<number> {
    try {
      const docRef = doc(db, 'customers', customerId);
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data()['complaintHistory']) {
        return snap.data()['complaintHistory'].length;
      }
    } catch(e) {}
    return 0;
  }

  async updateComplaintStatus(complaintId: string, status: 'Open' | 'In Progress' | 'Resolved'): Promise<void> {
    const docRef = doc(db, 'complaints', complaintId);
    await updateDoc(docRef, { status });
  }

  async saveFlowConfig(flowName: string, configJson: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
    const flowsRef = collection(db, 'users', user.uid, 'flows');
    await addDoc(flowsRef, {
      name: flowName,
      configJson,
      createdAt: serverTimestamp()
    });
  }

  // Seeding Mock Data
  async seedComplaintsIfEmpty(): Promise<boolean> {
    const complaintsRef = collection(db, 'complaints');
    const snap = await getDocs(complaintsRef);
    if (!snap.empty) return false;

    const mockedCustomers = [
      { id: 'c1', name: 'Alice Smith', email: 'alice@example.com' },
      { id: 'c2', name: 'Bob Johnson', email: 'bob@example.com' },
      { id: 'c3', name: 'Charlie Davis', email: 'charlie@example.com' }
    ];

    const customerBatch = writeBatch(db);
    mockedCustomers.forEach(c => {
      const ref = doc(db, 'customers', c.id);
      customerBatch.set(ref, { name: c.name, email: c.email, complaintHistory: [] });
    });
    await customerBatch.commit();

    const complaints: Complaint[] = [
      {
        source: 'Twitter', platform: 'Twitter', customerName: 'Alice Smith', customerId: 'c1',
        message: '@Brand My order never arrived! What\'s going on? Tracking says delivered but it\'s nowhere.',
        status: 'Open', timestamp: new Date(Date.now() - 3600000)
      },
      {
        source: 'Email', platform: 'Email', customerName: 'Bob Johnson', customerId: 'c2',
        message: 'Hello, the software subscription charged me twice this month. Please refund the duplicate charge ASAP.',
        status: 'Open', timestamp: new Date(Date.now() - 7200000)
      },
      {
        source: 'WhatsApp', platform: 'WhatsApp', customerName: 'Charlie Davis', customerId: 'c3',
        message: 'Hi, I need help changing my delivery address for an order I placed 5 mins ago.',
        status: 'In Progress', timestamp: new Date(Date.now() - 86400000)
      },
      {
        source: 'Twitter', platform: 'Twitter', customerName: 'Alice Smith', customerId: 'c1',
        message: '@Brand App keeps crashing on iOS 17. Please fix!',
        status: 'Resolved', timestamp: new Date(Date.now() - 172800000)
      },
      {
        source: 'Email', platform: 'Email', customerName: 'Bob Johnson', customerId: 'c2',
        message: 'How do I upgrade to the premium tier?',
        status: 'Resolved', timestamp: new Date(Date.now() - 259200000)
      },
      {
        source: 'WhatsApp', platform: 'WhatsApp', customerName: 'Alice Smith', customerId: 'c1',
        message: 'Is the new product in stock at the downtown store?',
        status: 'Resolved', timestamp: new Date(Date.now() - 345600000)
      },
      {
        source: 'Email', platform: 'Email', customerName: 'Charlie Davis', customerId: 'c3',
        message: 'My account is locked and resetting password doesn\'t work.',
        status: 'Open', timestamp: new Date(Date.now() - 432000000)
      },
      {
        source: 'Twitter', platform: 'Twitter', customerName: 'Bob Johnson', customerId: 'c2',
        message: '@Brand the new dashboard update is confusing. Where is the settings menu?',
        status: 'In Progress', timestamp: new Date(Date.now() - 518400000)
      },
      {
        source: 'WhatsApp', platform: 'WhatsApp', customerName: 'Charlie Davis', customerId: 'c3',
        message: 'Can I get a discount code for my friend?',
        status: 'Resolved', timestamp: new Date(Date.now() - 604800000)
      },
      {
        source: 'Email', platform: 'Email', customerName: 'Alice Smith', customerId: 'c1',
        message: 'I want to cancel my account. Please confirm.',
        status: 'Open', timestamp: new Date(Date.now() - 691200000)
      }
    ];

    const complantBatch = writeBatch(db);
    complaints.forEach(cp => {
      const ref = doc(complaintsRef);
      complantBatch.set(ref, cp);
    });
    await complantBatch.commit();
    return true;
  }
}
