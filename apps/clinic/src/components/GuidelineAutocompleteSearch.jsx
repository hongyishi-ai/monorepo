// src/components/GuidelineAutocompleteSearch.jsx

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import PropTypes from 'prop-types';

const GuidelineAutocompleteSearch = ({ guidelines, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchedGuidelines = guidelines.filter(guideline => {
        const { systemName, guidelineName, question, answer } = guideline;
        return (
          (systemName && systemName.toLowerCase().includes(lowerSearchTerm)) ||
          (guidelineName && guidelineName.toLowerCase().includes(lowerSearchTerm)) ||
          (question && question.toLowerCase().includes(lowerSearchTerm)) ||
          (answer && answer.toLowerCase().includes(lowerSearchTerm))
        );
      });
      setSuggestions(matchedGuidelines);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, guidelines]);

  const handleSelect = (guideline) => {
    setSearchTerm(''); // 清空搜索框
    setSuggestions([]);
    onSelect(guideline);
  };

  return (
    <div className="relative w-full">
      <Input
        type="text"
        placeholder="搜索关键词..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2"
      />
      {suggestions.length > 0 && (
        <ScrollArea className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelect(suggestion)}
              >
                <div className="font-semibold">{suggestion.guidelineName}</div>
                {suggestion.question && (
                  <div className="text-sm text-gray-600">Q: {suggestion.question}</div>
                )}
                {suggestion.answer && (
                  <div className="text-sm text-gray-600">A: {suggestion.answer}</div>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
};

GuidelineAutocompleteSearch.propTypes = {
  guidelines: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      systemName: PropTypes.string,
      guidelineName: PropTypes.string,
      question: PropTypes.string,
      answer: PropTypes.string,
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default GuidelineAutocompleteSearch;