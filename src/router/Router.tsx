import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface RouteMatch {
  path: string;
  params: Record<string, string>;
  search: string;
}

interface RouterContextType {
  currentPath: string;
  params: Record<string, string>;
  searchParams: URLSearchParams;
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const useRouter = (): RouterContextType => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};

export const useNavigate = () => {
  const { navigate } = useRouter();
  return navigate;
};

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  const [search, setSearch] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.search || '';
    }
    return '';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      setSearch(window.location.search || '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    if (typeof window === 'undefined') return;

    const url = new URL(to, window.location.origin);
    const newPath = url.pathname;
    const newSearch = url.search;

    if (options?.replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }

    setCurrentPath(newPath);
    setSearch(newSearch);
    window.scrollTo(0, 0);
  }, []);

  const searchParams = new URLSearchParams(search);

  return (
    <RouterContext.Provider
      value={{
        currentPath,
        params: {},
        searchParams,
        navigate,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

// Route matching utility
export function matchRoute(pattern: string, actualPath: string): { matches: boolean; params: Record<string, string> } {
  // Normalize
  const pParts = pattern.split('/').filter(Boolean);
  const aParts = actualPath.split('/').filter(Boolean);

  if (pParts.length !== aParts.length) {
    return { matches: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < pParts.length; i++) {
    const p = pParts[i];
    const a = aParts[i];

    if (p.startsWith(':')) {
      const paramName = p.slice(1);
      params[paramName] = decodeURIComponent(a);
    } else if (p !== a) {
      return { matches: false, params: {} };
    }
  }

  return { matches: true, params };
}

// Declarative Link component
export const Link: React.FC<
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; className?: string }
> = ({ to, children, className, onClick, ...rest }) => {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && rest.target !== '_blank') {
      e.preventDefault();
      navigate(to);
    }
  };

  return (
    <a href={to} className={className} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};
