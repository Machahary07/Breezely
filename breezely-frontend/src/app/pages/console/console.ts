import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { getAuth, User, onAuthStateChanged, signOut } from 'firebase/auth';
import { app, db } from '../../../firebaseConfig';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faOpenai, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faEye, faEyeSlash, faCheck, faTrash, faPlus, faBrain, faBolt } from '@fortawesome/free-solid-svg-icons';
import * as SimpleIcons from 'simple-icons';

// Import new components
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { ChatInputComponent } from '../../components/chat-input/chat-input';

interface ChatItem {
  id: string;
  title: string;
}

interface ApiKeyData {
  key: string;
  status: 'active' | 'inactive';
  lastUpdated: any;
}

@Component({
  selector: 'app-console',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ChatInputComponent, FontAwesomeModule, FormsModule],
  templateUrl: './console.html',
  styleUrl: './console.sass'
})
export class ConsoleComponent implements OnInit, OnDestroy {
  // Icons
  faOpenai = faOpenai;
  faAnthropic = faBrain; 
  faGemini = faGoogle;
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
  recentChats: ChatItem[] = [];

  // API Keys state
  apiKeys: { [key: string]: ApiKeyData } = {
    openai: { key: '', status: 'inactive', lastUpdated: null },
    claude: { key: '', status: 'inactive', lastUpdated: null },
    gemini: { key: '', status: 'inactive', lastUpdated: null }
  };
  
  // Visibility toggles
  visibleKeys: { [key: string]: boolean } = {
    openai: false,
    claude: false,
    gemini: false
  };

  // Editing state
  editingKeys: { [key: string]: string } = {
    openai: '',
    claude: '',
    gemini: ''
  };

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  getSafeIcon(name: string): SafeHtml {
    const icon = (SimpleIcons as any)[name];
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
  }

  loadUserApiKeys(uid: string) {
    const userKeysRef = doc(db, 'users', uid, 'settings', 'credentials');
    this.unsubscribeUserKeys = onSnapshot(userKeysRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        Object.keys(this.apiKeys).forEach(provider => {
          if (data[provider]) {
            this.apiKeys[provider] = {
              key: data[provider],
              status: 'active',
              lastUpdated: new Date()
            };
          } else {
            this.apiKeys[provider] = { key: '', status: 'inactive', lastUpdated: null };
          }
        });
        this.cdr.detectChanges();
      }
    });
  }

  async onSaveKey(provider: string) {
    if (!this.user || !this.editingKeys[provider]) return;

    try {
      const userKeysRef = doc(db, 'users', this.user.uid, 'settings', 'credentials');
      await setDoc(userKeysRef, {
        [provider]: this.editingKeys[provider]
      }, { merge: true });
      
      this.editingKeys[provider] = ''; // Reset input
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

  onSelectChat(id: string) {
    this.activeChatId = id;
    this.showCustomize = false;
  }

  onSendMessage(text: string) {
    if (!text.trim()) return;

    // Create a mockup chat in recents
    const title = text.length > 30 ? text.substring(0, 30) + '...' : text;
    const newChat: ChatItem = {
      id: Math.random().toString(36).substring(7),
      title: title
    };

    this.recentChats.unshift(newChat);
    this.activeChatId = newChat.id;
    this.cdr.detectChanges();
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
