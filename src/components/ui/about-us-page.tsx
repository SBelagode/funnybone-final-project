"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { BrandImage } from "@/components/brand-image";

export default function AboutUsPage() {
  return (
    <div className="min-h-screen text-white w-full">
      {/* Hero Section */}
      <div
        className="flex items-center justify-center min-h-[40vh] py-8 md:py-12 
                    relative overflow-hidden"
      >
        <div
          className="relative z-10 flex flex-col md:flex-row items-center justify-between 
                      gap-8 md:gap-12 w-full max-w-6xl mx-auto px-3 md:px-5"
        >
          {/* Logo/Icon - Left side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex-shrink-0"
          >
            <BrandImage
              variant="mark"
              alt="Crackd logo"
              className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80"
            />
          </motion.div>

          {/* Text Content - Right side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 text-center md:text-left"
          >
            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              About Crackd
            </h1>

            {/* Mission Statement / Description */}
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-4">
              Where your pictures get a sense of humor.
            </p>
            <p className="text-base md:text-lg text-gray-400 leading-relaxed">
              Crackd transforms your photos into hilarious, witty captions. 
              We believe every picture deserves a good laugh, and we&apos;re 
              here to make that happen.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Our Values Section */}
      <div className="w-full py-32">
        <div className="w-full max-w-6xl mx-auto px-3 md:px-5">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center gap-4 mb-16 w-full"
          >
            <motion.div 
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 h-px bg-primary/30 max-w-none mb-4 origin-left"
            ></motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-center text-3xl md:text-4xl font-bold text-primary 
                          whitespace-nowrap px-4 mb-4"
            >
              Our Values
            </motion.h2>
            <motion.div 
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 h-px bg-primary/30 max-w-none mb-4 origin-right"
            ></motion.div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {/* Value 1: Humor */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-6 p-4 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Humor First</h3>
              <p className="text-gray-400 leading-relaxed">
                Laughter is universal. Every caption is designed to bring a smile.
              </p>
            </motion.div>

            {/* Value 2: Creativity */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-6 p-4 rounded-full bg-primary/10 border border-primary/20">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Creative Innovation</h3>
              <p className="text-gray-400 leading-relaxed">
                We push boundaries to deliver fresh, witty, and unexpected captions.
              </p>
            </motion.div>

            {/* Value 3: Community */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-6 p-4 rounded-full bg-primary/10 border border-primary/20">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Community Driven</h3>
              <p className="text-gray-400 leading-relaxed">
                Your votes, shares, and feedback shape what we become.
              </p>
            </motion.div>

          </div>
        </div>
      </div>

    </div>
  );
}
