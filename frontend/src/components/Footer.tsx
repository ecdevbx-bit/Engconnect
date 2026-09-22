'use client';

import { FormEvent } from 'react';
import { emitToast } from '../lib/toast';

export default function Footer() {
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.currentTarget.reset();
    emitToast({ title: 'Subscribed! 📨', body: 'Thanks for joining English Connection.' });
  };

  return (
    <footer id="footer" className="c-box border-t border-white/[0.06]">
      <div className="footer-grid">
        <div>
          <a href="#" className="nav-logo text-heading font-bold">
            <div className="logo-mark">EC</div>
            English Connection
          </a>
          <p className="footer-p text-body">
            Premium English learning for students, creators, and professionals who want confidence,
            clarity, and global communication skills.
          </p>
        </div>

        <div>
          <div className="footer-h text-heading">Platform</div>
          <a className="footer-a text-body hover:text-primary transition-colors" href="#">Sentence Puzzle</a>
          <a className="footer-a text-body hover:text-primary transition-colors" href="#">Voice AI</a>
          <a className="footer-a text-body hover:text-primary transition-colors" href="#">AI Tutor</a>
          <a className="footer-a text-body hover:text-primary transition-colors" href="#">AI Debate Mode</a>
          <a className="footer-a text-body hover:text-primary transition-colors" href="#">Leaderboard</a>
        </div>

        <div>
          <div className="footer-h text-heading">Company</div>
          <a className="footer-a text-body hover:text-primary transition-colors" href="#">About Us</a>
          <a className="footer-a text-body hover:text-primary transition-colors" href="#">Careers</a>
          <a className="footer-a text-body hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="footer-a text-body hover:text-primary transition-colors" href="#">Terms of Service</a>
        </div>

        <div>
          <div className="footer-h text-heading">Newsletter</div>
          <p className="text-body" style={{ fontSize: '13px', lineHeight: '1.75' }}>
            Get weekly English tips and platform updates.
          </p>
          <form className="nl-wrap" onSubmit={onSubmit}>
            <input className="nl-input" type="email" placeholder="your@email.com" required />
            <button className="nl-btn" type="submit">Join</button>
          </form>
        </div>
      </div>

      <div className="footer-bottom border-t border-white/[0.06]">
        <span className="text-muted-foreground">© 2026 English Connection. All rights reserved.</span>
        <span className="text-muted-foreground">Built for India&apos;s ambitious learners 🇮🇳</span>
      </div>
    </footer>
  );
}
