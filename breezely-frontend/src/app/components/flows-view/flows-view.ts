import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBolt, faArrowLeft, faRobot, faCheck, faPaperPlane, faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FlowsService, Complaint } from '../../services/flows.service';

@Component({
  selector: 'app-flows-view',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './flows-view.html',
  styleUrl: './flows-view.sass'
})
export class FlowsView implements OnInit {
  faSparkles = faBolt;
  faArrowLeft = faArrowLeft;
  faRobot = faRobot;
  faCheck = faCheck;
  faPaperPlane = faPaperPlane;
  faPlus = faPlus;
  faSpinner = faSpinner;
  faBolt = faBolt;

  currentView: 'home' | 'complaints' | 'builder' = 'home';

  // Flows Home Search and Grid
  searchQuery = '';
  flowCards = [
    { id: 'complaints', name: 'Unified Customer Complaint Communication Dashboard', description: 'Centralize and AI-assist customer complaints', useCase: 'Support', status: 'Active' },
    { id: 'tickets', name: 'Ticket Booking Assistant', description: 'Automate ticket generation and responses', useCase: 'Operations', status: 'Not configured' },
    { id: 'social', name: 'Social Media Auto Responder', description: 'AI-generated replies for social comments', useCase: 'Marketing', status: 'Marketplace' },
    { id: 'gmail', name: 'Gmail Auto Writer', description: 'Draft emails based on thread context', useCase: 'Productivity', status: 'Active' },
  ];
  
  // Complaints Dashboard State
  complaints: Complaint[] = [];
  filteredComplaints: Complaint[] = [];
  selectedComplaint: Complaint | null = null;
  customerHistoryCount = 0;
  
  filterPlatform = 'All';
  filterStatus = 'All';
  
  replyDraft: string = '';
  aiChatPrompt: string = '';
  isGeneratingReply: boolean = false;
  isChatting: boolean = false;

  // Flow Builder State
  builderPrompt: string = '';
  builderConfig: any = null;
  isBuildingConfig: boolean = false;
  
  constructor(
    private flowsService: FlowsService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.flowsService.seedComplaintsIfEmpty().then((seeded) => {
      if(seeded) console.log('Mock complaints seeded.');
      this.loadComplaints();
    });
  }

  get filteredFlowCards() {
    return this.flowCards.filter(c => 
      c.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      c.useCase.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  openFlow(card: any) {
    if (card.id === 'complaints') {
      this.currentView = 'complaints';
      this.loadComplaints();
    }
  }

  openBuilder() {
    this.currentView = 'builder';
    this.builderPrompt = '';
    this.builderConfig = null;
  }

  goHome() {
    this.currentView = 'home';
    this.selectedComplaint = null;
  }

  async loadComplaints() {
    this.complaints = await this.flowsService.getComplaints();
    this.applyFilters();
    this.cdr.detectChanges();
  }

  applyFilters() {
    this.filteredComplaints = this.complaints.filter(c => {
      const matchPlat = this.filterPlatform === 'All' || c.platform === this.filterPlatform;
      const matchStat = this.filterStatus === 'All' || c.status === this.filterStatus;
      return matchPlat && matchStat;
    });
  }

  async selectComplaint(c: Complaint) {
    this.selectedComplaint = c;
    this.replyDraft = '';
    this.isGeneratingReply = true;
    this.customerHistoryCount = await this.flowsService.getCustomerHistoryCount(c.customerId);
    this.cdr.detectChanges();
    
    try {
      this.replyDraft = await this.flowsService.generateSuggestedReply(c, this.customerHistoryCount);
    } catch (e: any) {
      alert(e.message || 'Error generating reply');
    } finally {
      this.isGeneratingReply = false;
      this.cdr.detectChanges();
    }
  }

  async sendChatToAi() {
    if (!this.aiChatPrompt.trim() || !this.selectedComplaint) return;
    this.isChatting = true;
    const prompt = this.aiChatPrompt;
    this.aiChatPrompt = '';
    this.cdr.detectChanges();

    try {
      const newDraft = await this.flowsService.chatWithAssistant(prompt, this.replyDraft, this.selectedComplaint);
      this.replyDraft = newDraft;
    } catch (e: any) {
      alert(e.message || 'Error chatting with AI');
    } finally {
      this.isChatting = false;
      this.cdr.detectChanges();
    }
  }

  async markResolved() {
    if (!this.selectedComplaint || !this.selectedComplaint.id) return;
    await this.flowsService.updateComplaintStatus(this.selectedComplaint.id, 'Resolved');
    this.selectedComplaint.status = 'Resolved';
    this.loadComplaints();
    this.cdr.detectChanges();
  }

  async sendReply() {
    alert('Reply sent successfully (simulated log).');
    await this.markResolved();
  }

  async buildFlow() {
    if (!this.builderPrompt.trim()) return;
    this.isBuildingConfig = true;
    this.cdr.detectChanges();

    try {
      const configStr = await this.flowsService.generateFlowConfig(this.builderPrompt);
      this.builderConfig = JSON.parse(configStr);
    } catch (e: any) {
      alert(e.message || 'Error parsing config or API failed');
    } finally {
      this.isBuildingConfig = false;
      this.cdr.detectChanges();
    }
  }

  async saveFlow() {
    if (!this.builderConfig) return;
    try {
      await this.flowsService.saveFlowConfig(this.builderConfig.name || 'New Flow', JSON.stringify(this.builderConfig, null, 2));
      alert('Flow saved successfully!');
      this.goHome();
    } catch (e) {
      alert('Error saving flow to Firestore');
    }
  }

  getObjectKeys(obj: any) {
    return obj ? Object.keys(obj) : [];
  }
}

