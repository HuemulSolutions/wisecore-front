import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function SearchPage() {
  const [mode, setMode] = useState("normal");
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold mb-6">Search</h1>
      <div className="flex gap-2">
        <Input
          placeholder="Buscar..."
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
        />
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Modo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="deep">Deep</SelectItem>
          </SelectContent>
        </Select>
        <Button>Buscar</Button>
      </div>
    </div>
  );
}
