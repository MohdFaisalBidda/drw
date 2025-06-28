import { appName } from "@/utils";
import { Github, Mail, Twitter } from "lucide-react";
import Image from "next/image";
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
            <a
              href="https://github.com/MohdFaisalBidda/drw"
              target="_blank"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://x.com/faisalB299"
              target="_blank"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="mailto:biddafaisal@gmail.com"
              target="_blank"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-gray-400 text-sm">
            &copy; 2025 SketchBoard. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
