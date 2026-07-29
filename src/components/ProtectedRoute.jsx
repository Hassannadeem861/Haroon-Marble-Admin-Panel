import React from 'react';
import { Result, Button } from 'antd';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Result
        status="403"
        title="Access Denied"
        subTitle="You need to log in to access this page."
        extra={
          <Button type="primary" onClick={() => (window.location.href = '/')}>
            Go to Login
          </Button>
        }
      />
    );
  }

  return children;
};

export default ProtectedRoute;
