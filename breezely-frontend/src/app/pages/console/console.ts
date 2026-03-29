import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { getAuth, User, onAuthStateChanged, signOut } from 'firebase/auth';
import { app, db } from '../../../firebaseConfig';
import { doc, setDoc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faOpenai } from '@fortawesome/free-brands-svg-icons';
import { faEye, faEyeSlash, faCheck, faTrash, faPlus, faBrain, faBolt } from '@fortawesome/free-solid-svg-icons';
import { siGooglegemini, siClaude } from 'simple-icons';

// Import new components
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { ChatInputComponent } from '../../components/chat-input/chat-input';
import { FlowsView } from '../../components/flows-view/flows-view';
import { PlaybooksView } from '../../components/playbooks-view/playbooks-view';

interface ChatItem {
  id: string;
  title: string;
}

interface ApiKeyData {
  key: string;
  modelId: string;
  status: 'active' | 'inactive';
  lastUpdated: any;
}

@Component({
  selector: 'app-console',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ChatInputComponent, FlowsView, PlaybooksView, FontAwesomeModule, FormsModule],
  templateUrl: './console.html',
  styleUrl: './console.sass'
})
export class ConsoleComponent implements OnInit, OnDestroy {
  // Icons
  faOpenai = faOpenai;
  faAnthropic = faBrain; 

  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faCheck = faCheck;
  faTrash = faTrash;
  faPlus = faPlus;
  faSparkles = faBolt;

  // Firebase state
  user: User | null = null;
  isLoading: boolean = true;
  private auth = getAuth(app);
  private unsubscribeUserKeys: any = null;

  // Layout state
  sidebarCollapsed: boolean = false;
  showCustomize: boolean = false;
  activeCustomizeTab: string = 'api-keys';
  
  // Chat state
  activeChatId: string | null = null;
  activeTab: 'chats' | 'flows' | 'playbooks' = 'chats';
  recentChats: ChatItem[] = [];
  private unsubscribeChats: any = null;

  // API Keys state
  apiKeys: { [key: string]: ApiKeyData } = {
    openai: { key: '', modelId: 'gpt-4o', status: 'inactive', lastUpdated: null },
    claude: { key: '', modelId: 'claude-4-sonnet', status: 'inactive', lastUpdated: null },
    gemini: { key: '', modelId: 'gemini-pro-latest', status: 'inactive', lastUpdated: null }
  };
  
  // Model options
  providerModels: { [key: string]: string[] } = {
    gemini: ['gemini-2.5-pro', 'gemini-pro-latest', 'gemini-flash-latest'],
    openai: ['gpt-5.4', 'gpt-5.4-mini', 'gpt-4o'],
    claude: ['claude-4-opus', 'claude-4-sonnet', 'claude-4-haiku']
  };

  // Visibility toggles
  visibleKeys: { [key: string]: boolean } = {
    openai: false,
    claude: false,
    gemini: false
  };

  // Editing state
  editingKeys: { [key: string]: { key: string, modelId: string } } = {
    openai: { key: '', modelId: 'gpt-4o' },
    claude: { key: '', modelId: 'claude-4-sonnet' },
    gemini: { key: '', modelId: 'gemini-pro-latest' }
  };

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  // Simple Icons map for provider icons
  private simpleIconsMap: { [key: string]: any } = {
    'siGooglegemini': siGooglegemini,
    'siClaude': siClaude
  };

  getSafeIcon(name: string): SafeHtml {
    const icon = this.simpleIconsMap[name];
    if (!icon) return '';
    // Scale down simple icons to match text size
    const svg = icon.svg.replace('<svg', `<svg style="width: 14px; height: 14px; fill: currentColor; vertical-align: middle; margin-top: -2px;"`);
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      onAuthStateChanged(this.auth, (currentUser) => {
        if (currentUser) {
          this.user = currentUser;
          this.loadUserApiKeys(currentUser.uid);
          this.loadUserChats();
        } else {
          this.router.navigate(['/signin']);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    } else {
      this.isLoading = true;
    }
  }

  ngOnDestroy() {
    if (this.unsubscribeUserKeys) {
      this.unsubscribeUserKeys();
    }
    if (this.unsubscribeChats) {
      this.unsubscribeChats();
    }
  }

  // ─── Firebase Fetch Data ───
  loadUserChats() {
    if (!this.user) return;
    const chatsRef = collection(db, 'users', this.user.uid, 'chats');
    const q = query(chatsRef, orderBy('updatedAt', 'desc'));
    
    this.unsubscribeChats = onSnapshot(q, (snapshot) => {
      this.recentChats = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data()['title'] || 'New Chat'
      }));
      this.cdr.detectChanges();
    });
  }

  loadUserApiKeys(uid: string) {
    const userKeysRef = doc(db, 'users', uid, 'settings', 'credentials');
    this.unsubscribeUserKeys = onSnapshot(userKeysRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        Object.keys(this.apiKeys).forEach(provider => {
          if (data[provider]) {
            this.apiKeys[provider] = {
              key: data[provider].key || data[provider], // Migrate old string format if needed
              modelId: data[provider].modelId || this.apiKeys[provider].modelId,
              status: 'active',
              lastUpdated: new Date()
            };
          } else {
            this.apiKeys[provider] = { key: '', modelId: this.apiKeys[provider].modelId, status: 'inactive', lastUpdated: null };
          }
        });
        this.cdr.detectChanges();

        // Broadcast to Chrome Extension securely
        window.postMessage({
          type: 'BREEZELY_API_KEYS_SYNC',
          keys: {
            gemini: data['gemini'] || null,
            claude: data['claude'] || null,
            openai: data['openai'] || null
          }
        }, '*');
      } else {
        // If document doesn't exist, broadcast empty keys
        window.postMessage({
          type: 'BREEZELY_API_KEYS_SYNC',
          keys: { gemini: null, claude: null, openai: null }
        }, '*');
      }
    });
  }

  async onSaveKey(provider: string) {
    if (!this.user || !this.editingKeys[provider].key) return;

    try {
      const userKeysRef = doc(db, 'users', this.user.uid, 'settings', 'credentials');
      await setDoc(userKeysRef, {
        [provider]: {
          key: this.editingKeys[provider].key,
          modelId: this.editingKeys[provider].modelId
        }
      }, { merge: true });
      
      this.editingKeys[provider].key = ''; // Reset input
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  }

  async onRemoveKey(provider: string) {
    if (!this.user) return;
    
    try {
      const userKeysRef = doc(db, 'users', this.user.uid, 'settings', 'credentials');
      // In Firestore, to remove a field we use deleteField() usually, but here we can just set to null
      await setDoc(userKeysRef, {
        [provider]: null
      }, { merge: true });
    } catch (error) {
      console.error('Error removing API key:', error);
    }
  }

  toggleKeyVisibility(provider: string) {
    this.visibleKeys[provider] = !this.visibleKeys[provider];
  }

  // ─── Event Handlers ───
  onToggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onToggleCustomize() {
    this.showCustomize = !this.showCustomize;
  }

  onNewChat() {
    this.activeChatId = null;
    this.showCustomize = false;
  }

  onSearch() {
    // Implement search logic later
  }

  onSelectChat(chatId: string) {
    this.showCustomize = false;
    this.activeTab = 'chats';
    this.activeChatId = chatId;
  }

  onTabChange(tab: 'chats' | 'flows' | 'playbooks') {
    this.activeTab = tab;
    if (tab !== 'chats') {
      this.showCustomize = false;
      this.activeChatId = null;
    }
  }

  async onSendMessage(text: string) {
    if (!text.trim() || !this.user) return;

    const title = text.length > 30 ? text.substring(0, 30) + '...' : text;
    
    try {
      const chatsRef = collection(db, 'users', this.user.uid, 'chats');
      const docRef = await addDoc(chatsRef, {
        title: title,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      // The snapshot listener will automatically add it to recentChats
      this.activeChatId = docRef.id;
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Error creating chat:', e);
    }
  }

  onLogout() {
    if (isPlatformBrowser(this.platformId)) {
      signOut(this.auth).then(() => {
        this.router.navigate(['/signin']);
      });
    }
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  getFirstName(): string {
    if (!this.user?.displayName) return 'Guest';
    return this.user.displayName.split(' ')[0];
  }
}
