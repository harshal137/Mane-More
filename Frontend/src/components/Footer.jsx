import React from 'react';
import { Link } from 'react-router-dom';
import { trackButtonClick } from '../utils/analytics';
import {
  FaInstagram,
  FaFacebookF,
  FaPinterestP,
  FaTwitter
} from "react-icons/fa";


const FOOTER_BG = '#F8F7F5';
const FOOTER_CARD = '#FFFFFF';
const PRIMARY = '#3E2C4F';
const TEXT = '#2F2A35';
const MUTED = '#6D6875';
const BORDER = '#ECEAE6';
const ACCENT = '#DDE7C7';

const socials = [
  { icon: <FaInstagram />, link: "https://www.instagram.com/maneandmore.12/" },
  { icon: <FaFacebookF />, link: "#" },
  { icon: <FaPinterestP />, link: "#" },
  { icon: <FaTwitter />, link: "#" }
];

/** Renders the storefront footer, links, and social shortcuts. */
const Footer = () => {
  return (
    <footer
      className="pt-14 pb-8 px-4 md:px-8 lg:px-16"
      style={{
        backgroundColor: FOOTER_BG,
        borderTop: `1px solid ${BORDER}`,
        color: TEXT
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12">

          {/* Brand */}
          <div className="space-y-6">
            <Link to="/">
              <img
                src="/logo.png"
                alt="Mane & More"
                className="h-20 w-auto object-contain"
              />
            </Link>

            <p
              className="leading-relaxed"
              style={{ color: MUTED }}
            >
              Discover premium hair care, barber essentials and grooming products crafted for confidence and everyday style.
            </p>

            <div className="flex items-center gap-3">
              {socials.map((item, index) => (
                <a
                  key={index}
                  href={item.link}
                  target={item.link === "#" ? undefined : "_blank"}
                  rel={item.link === "#" ? undefined : "noopener noreferrer"}
                  aria-label="Social profile"
                  className="h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    backgroundColor: FOOTER_CARD,
                    border: `1px solid ${BORDER}`,
                    color: PRIMARY
                  }}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3
              className="font-semibold text-lg mb-5"
              style={{ color: TEXT }}
            >
              Shop
            </h3>

            <ul className="space-y-3">
              {['HairExtensions', 'Hair Care', 'Barber Tools', 'Gift Sets'].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="flex items-center gap-3 transition"
                    style={{ color: MUTED }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: PRIMARY }}
                    />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3
              className="font-semibold text-lg mb-5"
              style={{ color: TEXT }}
            >
              Support
            </h3>

            <ul className="space-y-3">
              {['Contact', 'Shipping', 'Returns', 'FAQs'].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="flex items-center gap-3 transition"
                    style={{ color: MUTED }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: PRIMARY }}
                    />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Newsletter */}
          <div className="space-y-6">
            <div>
              <h3
                className="font-semibold text-lg mb-5"
                style={{ color: TEXT }}
              >
                Contact
              </h3>

              <div
                className="space-y-4 text-sm"
                style={{ color: MUTED }}
              >
                <p className="flex gap-3">
                  <span
                    className="h-9 w-9 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: ACCENT,
                      color: PRIMARY
                    }}
                  >
                    📍
                  </span>
                  71-75, Shelton Street, Convent Garden, London, WC2H 9JQ, United Kingdom
                </p>

                <p className="flex gap-3">
                  <span
                    className="h-9 w-9 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: ACCENT,
                      color: PRIMARY
                    }}
                  >
                    📞
                  </span>
                  +44 07767925235
                </p>

                <p className="flex gap-3">
                  <span
                    className="h-9 w-9 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: ACCENT,
                      color: PRIMARY
                    }}
                  >
                    ✉️
                  </span>
                  manemore23@gmail.com
                </p>
              </div>
            </div>

            <div
              className="rounded-3xl p-6"
              style={{
                backgroundColor: FOOTER_CARD,
                border: `1px solid ${BORDER}`
              }}
            >
              <p
                className="text-sm mb-4"
                style={{ color: MUTED }}
              >
                Join our newsletter for exclusive offers, beauty tips and new arrivals.
              </p>

              <div className="flex flex-col gap-4">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full px-5 py-4 rounded-2xl outline-none transition"
                  style={{
                    backgroundColor: FOOTER_BG,
                    border: `1px solid ${BORDER}`,
                    color: TEXT,
                    fontSize: '14px'
                  }}
                />

                <button
                  type="button"
                  className="w-full py-4 rounded-2xl font-semibold transition-all duration-300"
                  style={{
                    backgroundColor: PRIMARY,
                    color: '#FFFFFF'
                  }}
                >
                  Join Now
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className="pt-8 mt-8"
          style={{
            borderTop: `1px solid ${BORDER}`
          }}
        >
          <div
            className="flex flex-col md:flex-row justify-between gap-4 text-sm"
            style={{ color: MUTED }}
          >
            <p>© 2025 Mane & More. All rights reserved.</p>

            <div className="flex flex-wrap gap-4">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Shipping</a>
              <a href="#">Returns</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
