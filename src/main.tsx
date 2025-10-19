// tradr-frontend-new/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink } from '@apollo/client';

const httpLink = new HttpLink({
  uri: 'http://localhost:3001/graphql', // Your GraphQL Edge Service URL
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
);