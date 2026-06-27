import Link from "next/link";
import { Instagram, Twitter } from "lucide-react";

export default async function Footer() {
    const LOGO_URL =
        "https://res.cloudinary.com/diyjz7pvk/image/upload/v1766663877/Rank_m7ctpr.png";

    return (
        <footer className="bg-white border-t border-slate-200 py-12 md:py-16">
            <div className="container mx-auto px-6">
                {/* Top Footer */}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    {/* Brand */}
                    <div>
                        <div className="mb-4 flex items-center gap-2">
                            <img
                                src={LOGO_URL}
                                alt="RankMatters"
                                className="h-6 w-auto object-contain opacity-80 grayscale"
                            />
                        </div>

                        <p className="text-sm leading-relaxed text-slate-500">
                            Helping aspirants analyze their performance with precision and
                            trust.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="mb-4 text-sm font-bold text-slate-900">
                            Quick Links
                        </h4>

                        <ul className="space-y-2 text-sm text-slate-500">
                            <li>
                                <Link href="/" className="hover:text-blue-600">
                                    Home
                                </Link>
                            </li>

                            <li>
                                <Link href="/about" className="hover:text-blue-600">
                                    About Us
                                </Link>
                            </li>

                            <li>
                                <Link href="/contact" className="hover:text-blue-600">
                                    Contact
                                </Link>
                            </li>

                            <li>
                                <Link href="/privacy" className="hover:text-blue-600">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Exams */}
                    <div>
                        <h4 className="mb-4 text-sm font-bold text-slate-900">Exams</h4>

                        <ul className="space-y-2 text-sm text-slate-500">
                            <li>
                                <Link href="/ssc-exams" className="hover:text-blue-600">
                                    SSC Exams
                                </Link>
                            </li>

                            <li>
                                <Link
                                    href="/rrb-railway-exams"
                                    className="hover:text-blue-600"
                                >
                                    Railway Exams
                                </Link>
                            </li>

                            <li>
                                <Link href="/banking-exams" className="hover:text-blue-600">
                                    Banking Exams
                                </Link>
                            </li>

                            <li>
                                <Link
                                    href="/state-and-others-exams"
                                    className="hover:text-blue-600"
                                >
                                    State & Others Exams
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Connect */}
                    <div>
                        <h4 className="mb-4 text-sm font-bold text-slate-900">Connect</h4>

                        <div className="flex gap-4">
                            <a
                                href="https://x.com/rankmatters01"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="X"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-black hover:text-white"
                            >
                                <Twitter className="h-4 w-4" />
                            </a>

                            <a
                                href="https://www.instagram.com/rankmatters01/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-pink-600 hover:text-white"
                            >
                                <Instagram className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-sm text-slate-400 md:flex-row">
                    <p>
                        &copy; {new Date().getFullYear()} RankMatters. All rights reserved.
                    </p>

                    <div className="flex gap-5">
                        <Link href="/privacy" className="hover:text-blue-600">
                            Terms
                        </Link>

                        <Link href="/privacy" className="hover:text-blue-600">
                            Privacy
                        </Link>

                        <Link href="/privacy" className="hover:text-blue-600">
                            Cookies
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}