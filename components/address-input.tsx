"use client";

import { useEffect, useRef, useState } from "react";
import { autocompleteAddressAction } from "@/app/actions/geocode";
import type { AddressSuggestion } from "@/lib/maps/geocode";
import { Input } from "@/components/ui";

export function AddressInput({
  id,
  value,
  onText,
  onPick,
  placeholder,
  disabled,
  minChars = 4,
}: {
  id?: string;
  value: string;
  onText: (value: string) => void;
  onPick: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  disabled?: boolean;
  minChars?: number;
}) {
  const [query, setQuery] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<number | null>(null);
  const pickedRef = useRef(false);

  if (value !== prevValue) {
    setPrevValue(value);
    setQuery(value);
  }

  useEffect(() => {
    if (abortRef.current) window.clearTimeout(abortRef.current);
    const q = query.trim();

    if (pickedRef.current) {
      pickedRef.current = false;
      return;
    }
    if (q.length < minChars) return;

    abortRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const list = await autocompleteAddressAction(q);
        setSuggestions(list);
        setNotFound(list.length === 0);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (abortRef.current) window.clearTimeout(abortRef.current);
    };
  }, [query, minChars]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(suggestion: AddressSuggestion) {
    pickedRef.current = true;
    setQuery(suggestion.label);
    setSuggestions([]);
    setOpen(false);
    onPick(suggestion);
  }

  const trimmed = query.trim();
  const showList =
    open &&
    trimmed.length >= minChars &&
    (loading || suggestions.length > 0 || notFound);

  return (
    <div ref={rootRef} className="relative">
      <Input
        id={id}
        value={query}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          setSuggestions([]);
          setOpen(v.trim().length >= minChars);
          onText(v);
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
      />

      {showList && (
        <ul className="absolute left-0 right-0 z-20 max-h-60 overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {loading && (
            <li className="px-3 py-2 text-xs text-zinc-400">Buscando…</li>
          )}

          {suggestions.map((s, i) => (
            <li key={`${s.lat}-${s.lng}-${i}`}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-zinc-100 active:bg-zinc-100 dark:hover:bg-zinc-800 dark:active:bg-zinc-800"
              >
                {s.label}
              </button>
            </li>
          ))}

          {!loading && notFound && (
            <li className="px-3 py-2 text-xs text-zinc-500">
              Nenhum endereço encontrado. Continue digitando ou salve sem
              sugestão (ele tenta geocodificar ao salvar).
            </li>
          )}
        </ul>
      )}
    </div>
  );
}