import { useEffect, useMemo, useRef, useState } from 'react';
import type { CityModel } from '../model/cityModel';
import { useStore } from '../state/store';
import { splitPath } from './format';
import { SearchIcon } from './Icons';

const MAX_RESULTS = 8;

/** Ranks paths for a query: file-name matches first, then shorter paths. */
function search(model: CityModel, query: string): number[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];
  const hits: Array<{ path: number; score: number }> = [];
  for (const file of model.files) {
    const lower = file.path.toLowerCase();
    const at = lower.indexOf(needle);
    if (at === -1) continue;
    const inName = at > lower.lastIndexOf('/');
    hits.push({ path: model.pathOfFile[file.id]!, score: (inName ? 0 : 1000) + lower.length });
  }
  hits.sort((a, b) => a.score - b.score);
  return hits
    .slice(0, MAX_RESULTS)
    .map((hit) => hit.path)
    .filter((path) => path >= 0);
}

export function Search({ model }: { model: CityModel }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => search(model, query), [model, query]);

  // "/" focuses the search from anywhere, like most code hosts.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.target instanceof HTMLInputElement) return;
      event.preventDefault();
      input.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const choose = (path: number) => {
    useStore.getState().select(path);
    setOpen(false);
    setQuery('');
    input.current?.blur();
  };

  return (
    <div className="search">
      <SearchIcon />
      <input
        ref={input}
        type="search"
        className="search-input"
        placeholder="Find a file"
        aria-label="Find a file"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown')
            setActive((value) => Math.min(value + 1, results.length - 1));
          else if (event.key === 'ArrowUp') setActive((value) => Math.max(value - 1, 0));
          else if (event.key === 'Enter' && results[active] !== undefined) choose(results[active]!);
          else if (event.key === 'Escape') input.current?.blur();
          else return;
          event.preventDefault();
        }}
      />
      <kbd className="search-hint">/</kbd>
      {open && query.trim().length >= 2 && (
        <ul className="search-results" role="listbox">
          {results.length === 0 && (
            <li className="search-empty">No file matches “{query.trim()}”.</li>
          )}
          {results.map((path, i) => {
            const { dir, name } = splitPath(model.paths[path]!);
            return (
              <li key={path} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  className={`search-result mono${i === active ? ' is-active' : ''}`}
                  // Fire before the input loses focus and closes the list.
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(path);
                  }}
                  onMouseEnter={() => setActive(i)}
                >
                  <span className="search-dir">{dir}</span>
                  {name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
