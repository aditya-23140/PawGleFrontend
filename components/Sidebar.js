import { Button } from "@/components/ui/button";

export function Sidebar({ categories, selectedCategory, onSelectCategory }) {
  return (
    <div className="w-64 bg-[var(--backgroundColor)] text-[var(--textColor)] p-4 overflow-y-auto h-[84vh] pt-10 rounded-lg mb-4 ml-2 z-10">
      <h2 className="text-3xl font-semibold mb-4">Categories</h2>
      <nav>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "ghost"}
            className="w-full justify-start mb-2 bg-[var(--secondaryColor2)] hover:bg-[var(--secondaryColor)] text-[var(--textColor3)] hover:text-[var(--textColor3)] focus:text-[var(--textColor3)] focus:bg-[var(--primary2)] shadow-lg hover:scale-105 transition-all"
            onClick={() => onSelectCategory(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </nav>
    </div>
  );
}
