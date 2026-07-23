'use client';

import { useEffect } from 'react';

export default function ClientErrorTrap() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Patch Node.prototype.removeChild to prevent Google Translate & browser extensions from crashing React
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(child: T): T {
      if (child.parentNode !== this) {
        if (child.parentNode) {
          return child.parentNode.removeChild(child) as T;
        }
        return child;
      }
      return originalRemoveChild.call(this, child) as T;
    };

    // Patch Node.prototype.insertBefore to prevent Google Translate & browser extensions from crashing React
    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
      if (referenceNode && referenceNode.parentNode !== this) {
        if (referenceNode.parentNode) {
          return referenceNode.parentNode.insertBefore(newNode, referenceNode) as T;
        }
        return this.appendChild(newNode) as T;
      }
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    };

    // Global uncaught error handler to prevent blank screens
    const handleGlobalError = (event: ErrorEvent) => {
      if (
        event.message?.includes("removeChild") ||
        event.message?.includes("insertBefore") ||
        event.message?.includes("Target is not defined")
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleGlobalError);
    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  return null;
}
