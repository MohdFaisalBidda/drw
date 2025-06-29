import { appName } from "@/utils";
import { Github, Mail, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

function Footer() {
  return (
    <footer
      style={{ backgroundColor: "#202025" }}
      className="relative z-10 py-12 border-t border-white/10"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col space-y-3 items-center md:items-start">
            <div className="flex space-x-3 items-center ">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <Image
                  src={"/logo1.png"}
                  alt={"logo"}
                  width={100}
                  height={100}
                />
              </div>
              <span className="text-3xl font-bagel-fat font-semibold text-white">
                {appName}
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed text-center md:text-start">
              The collaborative whiteboard <br />
              for visual thinkers and creative teams.
            </p>
          </div>

          <div className="flex space-x-6">
            <Link
              href="https://github.com/MohdFaisalBidda/drw"
              target="_blank"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </Link>
            <Link href="https://x.com/faisalB299" target="_blank" className="">
              <span className="w-5 h-5 text-gray-400 hover:text-white transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 256 256"
                  className="w-5 h-5 fill-current"
                >
                  <g fill="currentColor" fillRule="nonzero">
                    <g transform="scale(8.53333,8.53333)">
                      <path d="M26.37,26l-8.795,-12.822l0.015,0.012l7.93,-9.19h-2.65l-6.46,7.48l-5.13,-7.48h-6.95l8.211,11.971l-0.001,-0.001l-8.66,10.03h2.65l7.182,-8.322l5.708,8.322zM10.23,6l12.34,18h-2.1l-12.35,-18z"></path>
                    </g>
                  </g>
                </svg>
              </span>
            </Link>
            <Link
              href="mailto:biddafaisal@gmail.com"
              target="_blank"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Mail className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-gray-400 text-sm">
            &copy; 2025 Drw. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
