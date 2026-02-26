"use strict";
"use client";

import React from 'react';
import Typewriter from 'typewriter-effect';
import { motion } from 'framer-motion';

const TypewriterComponent = ({ className = "" }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className={`text-xl sm:text-2xl text-zinc-500 font-semibold ${className}`}
        >
            <Typewriter
                options={{
                    strings: [
                        'Your campus.',
                        'Your zone.',
                        'Your hive.',
                    ],
                    autoStart: true,
                    loop: true,
                    delay: 75,
                    deleteSpeed: 50,
                    wrapperClassName: "typewriter-wrapper",
                    cursorClassName: "typewriter-cursor text-yellow-500",
                }}
            />
        </motion.div>
    );
};

export default TypewriterComponent;
