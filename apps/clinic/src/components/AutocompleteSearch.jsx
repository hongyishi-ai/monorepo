import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const AutocompleteSearch = ({ medications, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (searchTerm.length > 0) {
      const matchedMedications = medications.filter(med =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSuggestions(matchedMedications.map(med => med.name));
    } else {
      setSuggestions([]);
    }
    onSearch(searchTerm);
  }, [searchTerm, medications, onSearch]);

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="搜索药品..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2"
        aria-label="搜索药品"
        aria-expanded={suggestions.length > 0}
        aria-controls="search-suggestions"
        aria-autocomplete="list"
      />
      {suggestions.length > 0 && (
        <ScrollArea 
          className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40"
          id="search-suggestions"
          role="listbox"
        >
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                role="option"
                aria-selected={searchTerm === suggestion}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer focus:bg-gray-200 focus:outline-none"
                onClick={() => {
                  setSearchTerm(suggestion);
                  setSuggestions([]);
                }}
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setSearchTerm(suggestion);
                    setSuggestions([]);
                  }
                }}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
};

export default AutocompleteSearch;