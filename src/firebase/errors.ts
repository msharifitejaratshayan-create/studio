'use client';

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

// A custom error class for Firestore permission errors with context.
export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;
  constructor(context: SecurityRuleContext) {
    const { path, operation } = context;
    const message = `Firestore error: Missing or insufficient permissions. The following ${operation} request was denied at path: ${path}.`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
  }
}
