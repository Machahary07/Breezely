import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarIconBtnComponent } from '../sidebar-icon-btn/sidebar-icon-btn';
import { UserAvatarComponent } from '../user-avatar/user-avatar';
import gsap from 'gsap';

interface ChatItem {
  id: string;
  title: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarIconBtnComponent, UserAvatarComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.sass'
})
export class SidebarComponent implements OnChanges {
  @Input() collapsed = false;
  @Input() user: any = null;
  @Input() recentChats: ChatItem[] = [];
  @Input() activeChatId: string | null = null;
  @Input() customizeActive = false;
  
  @Output() toggle = new EventEmitter<void>();
  @Output() customize = new EventEmitter<void>();
  @Output() newChat = new EventEmitter<void>();
  @Output() search = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() selectChat = new EventEmitter<string>();
  @Output() tabChange = new EventEmitter<'chats' | 'flows' | 'playbooks'>();

  @ViewChild('sidebarElement') sidebarElement!: ElementRef;
  @ViewChild('searchInput') searchInputElement!: ElementRef;

  activeTab: 'chats' | 'flows' | 'playbooks' = 'chats';
  recentsOpen = true;
  isSearchActive = false;
  searchQuery = '';

  ngOnChanges(changes: SimpleChanges) {
    // Left empty since we moved to CSS only
  }

  onToggle() {
    this.toggle.emit();
  }

  onCustomize() {
    this.customize.emit();
  }

  onNewChat() {
    this.newChat.emit();
  }

  activateSearch() {
    this.isSearchActive = true;
    setTimeout(() => {
      if (this.searchInputElement) {
        this.searchInputElement.nativeElement.focus();
      }
    }, 50);
  }

  get searchResults(): ChatItem[] {
    if (!this.searchQuery.trim()) return this.recentChats;
    const query = this.searchQuery.toLowerCase();
    return this.recentChats.filter(chat => chat.title.toLowerCase().includes(query));
  }

  onSearchBlur() {
    // Delay hiding the search to allow dropdown item clicks to register
    setTimeout(() => {
      this.isSearchActive = false;
      this.searchQuery = '';
    }, 150);
  }

  onSelectSearchResult(id: string) {
    this.isSearchActive = false;
    this.searchQuery = '';
    this.selectChat.emit(id);
  }

  onSearch() {
    this.search.emit();
  }

  onLogout() {
    this.logout.emit();
  }

  onSelectChat(id: string) {
    this.selectChat.emit(id);
  }

  setTab(tab: 'chats' | 'flows' | 'playbooks') {
    this.activeTab = tab;
    this.tabChange.emit(tab);
  }

  getUserInitial(): string {
    if (this.user?.displayName) return this.user.displayName.charAt(0).toUpperCase();
    if (this.user?.email) return this.user.email.charAt(0).toUpperCase();
    return 'B';
  }
}
