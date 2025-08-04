"use client";
import { useState } from "react";
import { ImageGrid } from "@/components/ImageGrid";
import { Sidebar } from "@/components/Sidebar";

const categories = [
  { id: "Dogs", name: "Dogs" },
  { id: "Cats", name: "Cats" },
];

export default function Dashboard() {
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);

  return (
    <div className="dark bg-[--c3] text-white min-h-screen">
      <div className="flex overflow-hidden pt-24">
        <Sidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <div className="mx-3 px-1 py-6 rounded-xl backdrop-blur-xl testt w-full h-[82vh] border border-[var(--secondaryColor2)]">
          <main className="flex-1 px-2 overflow-y-auto h-[76vh] scroll-smooth bg-[var(--background)] z-10">
            <h1 className="text-3xl font-bold mb-6 text-[var(--secondaryColor)]">
              <span className="underline">
                {categories.find((cat) => cat.id === selectedCategory)?.name}
              </span>
              {" "}
              <span className="underline">Images</span>
            </h1>
            <ImageGrid category={selectedCategory} />
          </main>
        </div>
      </div>
    </div>
  );
}
