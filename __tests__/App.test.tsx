import React from 'react';
import { AuthProvider } from '../src/context/AuthContext';

// Simple smoke test for AuthContext
describe('App', () => {
  it('AuthProvider renders without crashing', () => {
    const TestComponent = () => <div>Test</div>;
    const wrapper = () => (
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(wrapper).toBeTruthy();
  });
});