import { motion } from "framer-motion";

interface WordDisplayProps {
  words: string[];
  currentIndex: number;
}

export default function WordDisplay({ words, currentIndex }: WordDisplayProps) {
  return (
    <div className="p-8 text-center">
      <div className="flex flex-wrap justify-center gap-4 text-3xl">
        {words.map((word, index) => (
          <motion.span
            key={`${word}-${index}`}
            initial={{ opacity: 0.5 }}
            animate={{
              opacity: index === currentIndex ? 1 : 0.5,
              scale: index === currentIndex ? 1.2 : 1,
              color: index === currentIndex ? "var(--primary)" : "inherit",
            }}
            className="inline-block px-2 py-1 rounded"
          >
            {word}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
