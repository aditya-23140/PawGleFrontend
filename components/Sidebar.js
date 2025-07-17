import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export function Sidebar({ categories, selectedCategory, onSelectCategory }) {
  return (
    <div className="w-64 bg-[var(--backgroundColor)] text-[var(--textColor)] p-4 overflow-y-auto h-[82vh] border border-[var(--secondaryColor2)] pt-10 rounded-lg mb-4 ml-2 z-10">
      <h2 className="text-3xl font-semibold mb-4">Categories</h2>
      <nav className="-ml-4">
        {categories.map((category) => (
          <div key={category.id} className="flex justify-end">
            {selectedCategory === category.id ? (
              <ChevronRight className="text-[var(--nigga)] relative top-2" />
            ) : (
              ""
            )}
            <Button
              variant={selectedCategory === category.id ? "default" : "ghost"}
              className={`w-[80%] justify-start mb-2 bg-[var(--secondaryColor2)] hover:bg-[var(--secondaryColor)] text-[var(--textColor3)] hover:text-[var(--textColor3)] text-base shadow-lg hover:scale-105 active:scale-95 transition-all ${selectedCategory===category.id ? "bg-[var(--nigga)] hover:bg-[#ff785d]" : ""}`}
              onClick={() => onSelectCategory(category.id)}
            >
              {category.name}
            </Button>
          </div>
        ))}
      </nav>
    </div>
  );
}
