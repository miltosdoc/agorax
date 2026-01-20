import { Link } from "wouter";
import { Mail, Facebook, Twitter } from "lucide-react";
import t from "@/i18n";

export default function Footer() {
  return (
    <footer 
      className="bg-primary text-white py-6 sm:py-8 mt-auto mb-16 sm:mb-0"
      data-testid="footer"
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {/* Brand Section */}
          <div data-testid="footer-brand">
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">AgoraX</h3>
            <p className="text-primary-foreground/90 text-sm leading-relaxed">
              {t("Platform for a more open and participatory government")}
            </p>
          </div>

          {/* Links Section */}
          <div data-testid="footer-links">
            <h3 className="text-sm sm:text-base font-bold mb-3 sm:mb-4">{t("Useful Links")}</h3>
            <ul className="text-primary-foreground/90 text-sm space-y-2">
              <li>
                <Link 
                  href="/how-it-works" 
                  className="hover:text-white transition-smooth inline-block min-h-[44px] flex items-center"
                  data-testid="link-how-it-works"
                >
                  {t("How it works")}
                </Link>
              </li>
              <li>
                <Link 
                  href="/faq" 
                  className="hover:text-white transition-smooth inline-block min-h-[44px] flex items-center"
                  data-testid="link-faq"
                >
                  {t("FAQ")}
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="hover:text-white transition-smooth inline-block min-h-[44px] flex items-center"
                  data-testid="link-terms"
                >
                  {t("Terms of Use")}
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="hover:text-white transition-smooth inline-block min-h-[44px] flex items-center"
                  data-testid="link-privacy"
                >
                  {t("Privacy Policy Footer")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div data-testid="footer-contact">
            <h3 className="text-sm sm:text-base font-bold mb-3 sm:mb-4">{t("Contact")}</h3>
            <ul className="text-primary-foreground/90 text-sm space-y-3">
              <li className="flex items-center min-h-[44px]">
                <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                <a 
                  href="mailto:agoraxdemocracy@gmail.com"
                  className="hover:text-white transition-smooth"
                  data-testid="link-email"
                >
                  agoraxdemocracy@gmail.com
                </a>
              </li>
            </ul>
            <div className="mt-4 flex space-x-4" data-testid="footer-social">
              <a 
                href="https://www.facebook.com/profile.php?id=61575832203534" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary-foreground/90 hover:text-white transition-smooth touch-target"
                aria-label="AgoraX στο Facebook"
                data-testid="link-facebook"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a 
                href="https://x.com/i/communities/1698639918732345441" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary-foreground/90 hover:text-white transition-smooth touch-target"
                aria-label="AgoraX Twitter Community"
                data-testid="link-twitter"
              >
                <Twitter className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div 
          className="mt-6 sm:mt-8 pt-6 border-t border-border/50 text-center text-primary-foreground/80 text-sm"
          data-testid="footer-copyright"
        >
          <p>© {new Date().getFullYear()} AgoraX - {t("All rights reserved")}</p>
        </div>
      </div>
    </footer>
  );
}
