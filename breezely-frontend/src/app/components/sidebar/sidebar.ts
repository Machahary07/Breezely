import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, SidebarIconBtnComponent, UserAvatarComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.sass'
})
export class SidebarComponent implements OnChanges {
  @Input() collapsed = false;
  @Input() user: any = null;
  @Input() recentChats: ChatItem[] = [];
  @Input() activeChatId: string | null = null;
  
  @Output() toggle = new EventEmitter<void>();
  @Output() newChat = new EventEmitter<void>();
  @Output() search = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() selectChat = new EventEmitter<string>();
  @Output() tabChange = new EventEmitter<'chats' | 'flows' | 'playbooks'>();

  @ViewChild('sidebarElement') sidebarElement!: ElementRef;

  activeTab: 'chats' | 'flows' | 'playbooks' = 'chats';
  recentsOpen = true;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['collapsed'] && !changes['collapsed'].firstChange) {
      this.animateSidebar();
    }
  }

  animateSidebar() {
    const width = this.collapsed ? 68 : 260;
    gsap.to(this.sidebarElement.nativeElement, {
      width: width,
      duration: 0.4,
      ease: 'power3.inOut'
    });
  }

  onToggle() {
    this.toggle.emit();
  }

  onNewChat() {
    this.newChat.emit();
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
