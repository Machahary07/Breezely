import { Component, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface QuickChip {
  icon: string;
  label: string;
  prompt: string;
}

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-input.html',
  styleUrl: './chat-input.sass'
})
export class ChatInputComponent {
  @Input() placeholder = 'How can I help you today?';
  @Input() userFirstname = '';
  @Input() greeting = 'Good afternoon';
  
  @Output() sendMessage = new EventEmitter<string>();

  @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;

  message = '';
  
  quickChips: QuickChip[] = [
    { icon: '🌐', label: 'Scrape Data', prompt: 'Scrape data from a website' },
    { icon: '📝', label: 'Fill Forms', prompt: 'Automate form filling on a website' },
    { icon: '🔄', label: 'Automate Flow', prompt: 'Create an automation workflow' },
    { icon: '📊', label: 'Monitor Page', prompt: 'Monitor a webpage for changes' },
    { icon: '🧪', label: 'Test UI', prompt: 'Run UI tests on my website' },
  ];

  onInput() {
    this.autoResize();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  onSend() {
    if (this.message.trim()) {
      this.sendMessage.emit(this.message.trim());
      this.message = '';
      this.autoResize();
    }
  }

  useChip(chip: QuickChip) {
    this.message = chip.prompt;
    this.autoResize();
    setTimeout(() => this.textarea.nativeElement.focus(), 0);
  }

  private autoResize() {
    const el = this.textarea.nativeElement;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }
}
