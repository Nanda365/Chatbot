# Testing Setup Guide

This document describes how to set up and run tests for the AI Support Platform frontend.

## Test Infrastructure

The project uses:
- Jest as the test runner
- React Testing Library for component testing
- TypeScript for type-safe tests

## Installation

To set up testing, you need to install additional dependencies:

```bash
npm install --save-dev @types/jest @types/node jest ts-jest jest-environment-jsdom
```

## Configuration Files

### jest.config.js

```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
};
```

### src/setupTests.ts

```typescript
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

## Example Tests

### Component Test - MessageBubble

```typescript
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../chat/MessageBubble';

describe('MessageBubble', () => {
  it('renders user message correctly', () => {
    render(
      <MessageBubble
        content="Hello, how can I help?"
        role="user"
        timestamp="10:30 AM"
      />
    );

    expect(screen.getByText('Hello, how can I help?')).toBeInTheDocument();
    expect(screen.getByText('10:30 AM')).toBeInTheDocument();
  });
});
```

### Component Test - ChatInput

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../chat/ChatInput';

describe('ChatInput', () => {
  it('calls onSend with message when send button is clicked', async () => {
    const onSend = jest.fn();
    render(<ChatInput onSend={onSend} />);
    
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Hello world');
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    await userEvent.click(sendButton);
    
    expect(onSend).toHaveBeenCalledWith('Hello world');
  });
});
```

### Integration Test - Login

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/auth/Login';
import { AuthProvider } from '../../contexts/AuthContext';

const MockLogin = () => (
  <BrowserRouter>
    <AuthProvider>
      <Login />
    </AuthProvider>
  </BrowserRouter>
);

describe('Login', () => {
  it('validates email format', async () => {
    render(<MockLogin />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });
});
```

## Running Tests

Add these scripts to package.json:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

Then run:

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

## Test Coverage Goals

Aim for:
- **80%+ coverage** for critical paths (auth, API calls)
- **60%+ coverage** for UI components
- **100% coverage** for utility functions

## Best Practices

1. **Test user interactions**, not implementation details
2. **Use accessible queries** (getByRole, getByLabelText)
3. **Mock external dependencies** (API calls, external libraries)
4. **Test error states** and edge cases
5. **Keep tests isolated** and independent

## Mocking API Calls

```typescript
import { api } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  api: {
    login: jest.fn(),
    sendMessage: jest.fn(),
  },
}));

describe('Component with API', () => {
  it('handles successful API call', async () => {
    (api.login as jest.Mock).mockResolvedValue({
      data: { token: 'abc123', user: { id: '1', name: 'Test' } },
    });
    
    // Test component behavior
  });
});
```

## Continuous Integration

Add test step to your CI/CD pipeline:

```yaml
- name: Run tests
  run: npm test -- --ci --coverage --maxWorkers=2
```

## Troubleshooting

### Common Issues

**Module not found errors:**
- Check moduleNameMapper in jest.config.js
- Verify import paths match

**Async tests timing out:**
- Use waitFor for async operations
- Increase timeout: jest.setTimeout(10000)

**React hooks errors:**
- Wrap components in proper providers
- Use renderHook for testing custom hooks

## Future Improvements

- [ ] Add E2E tests with Playwright
- [ ] Add visual regression tests
- [ ] Implement snapshot testing for components
- [ ] Add performance testing
- [ ] Set up test data factories

---

For more information, see:
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
