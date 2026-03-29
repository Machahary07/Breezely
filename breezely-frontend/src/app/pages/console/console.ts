import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { getAuth, User, onAuthStateChanged, signOut } from 'firebase/auth';
import { app } from '../../../firebaseConfig';

// Import new components
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { ChatInputComponent } from '../../components/chat-input/chat-input';

interface ChatItem {
  id: string;
  title: string;
}

@Component({
  selector: 'app-console',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ChatInputComponent],
  templateUrl: './console.html',
  styleUrl: './console.sass'
})
export class ConsoleComponent implements OnInit {
  user: User | null = null;
  isLoading: boolean = true;
  private auth = getAuth(app);

  // Layout state
  sidebarCollapsed: boolean = false;
  
  // Chat state
  activeChatId: string | null = null;
  recentChats: ChatItem[] = [];

  // Customize state
  showCustomize: boolean = false;
  activeCustomizeTab: string = 'api-keys';

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      onAuthStateChanged(this.auth, (currentUser) => {
        if (currentUser) {
          this.user = currentUser;
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
