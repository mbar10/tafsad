import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConfig } from '../config';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [forms, setForms] = useState([]);
  const [columns, setColumns] = useState([]);
  const [pendingForms, setPendingForms] = useState([])
  const [loginError, setLoginError] = useState('');
  const [formGroups, setFormGroups] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      fetchForms(token);
      fetchFormsGroup(token);
      fetchPendingForms();
      fetchColumns();
    }
  }, []);

  const handleAddComment = async (selectedFormId, comment) => {
    try {
      const { serverUrl } = getConfig();
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${serverUrl}/api/forms/${selectedFormId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: comment })
      });

      if (response.ok) {
        const comment = await response.json();
        setForms(prevForms =>
          prevForms.map(form =>
            form.id === selectedFormId ? {
              ...form,
              comments: [...form.comments || [], comment]
            } : form
          )
        )
        return comment
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const fetchColumns = async () => {
    try {
      const { serverUrl } = getConfig();
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${serverUrl}/api/columns`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setColumns(data);
      }
    } catch (error) {
      console.error('Error fetching columns:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setForms([]);
    setLoginError('');
    // Force navigation to login page
    navigate('/', { replace: true });
  };

  const fetchForms = async (token) => {
    try {
      const { serverUrl } = getConfig();
      const response = await fetch(`${serverUrl}/api/forms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        const data = await response.json();
        const { serverUrl } = getConfig();
        if (data.code === 'TOKEN_EXPIRED') {
          const refreshResponse = await fetch(`${serverUrl}/api/admin/refresh-token`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (refreshResponse.ok) {
            const { token: newToken } = await refreshResponse.json();
            localStorage.setItem('adminToken', newToken);
            // Retry the original request with new token
            return fetchForms(newToken);
          }
        }
        // If refresh failed or token is invalid, redirect to login
        handleLogout();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setForms(data);
      } else {
        // Handle other error cases
        handleLogout();
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      handleLogout();
    }
  };

  const fetchFormsGroup = async (token) => {
    try {
      const { serverUrl } = getConfig();
      const response = await fetch(`${serverUrl}/api/groups`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        const data = await response.json();
        const { serverUrl } = getConfig();
        if (data.code === 'TOKEN_EXPIRED') {
          const refreshResponse = await fetch(`${serverUrl}/api/admin/refresh-token`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (refreshResponse.ok) {
            const { token: newToken } = await refreshResponse.json();
            localStorage.setItem('adminToken', newToken);
            // Retry the original request with new token
            return fetchForms(newToken);
          }
        }
        // If refresh failed or token is invalid, redirect to login
        handleLogout();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setFormGroups(data);
      } else {
        // Handle other error cases
        handleLogout();
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      handleLogout();
    }
  };

  const handleLogin = async (username, password) => {
    try {
      setLoginError('');
      const { serverUrl } = getConfig();
      const response = await fetch(`${serverUrl}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem('adminToken', token);
        setIsAuthenticated(true);
        await fetchForms(token);
        navigate('/dashboard', { replace: true });
      } else {
        setLoginError('שם משתמש או סיסמה שגויים');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('אירעה שגיאה בהתחברות');
    }
  };

  const handleSort = (sortBy, sortOrder) => {
    const sortedForms = [...forms].sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
    });
    setForms(sortedForms);
  };

  const fetchPendingForms = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const { serverUrl } = getConfig();
      const response = await fetch(`${serverUrl}/api/pending-forms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPendingForms(data);
      }
    } catch (error) {
      console.error('Error fetching pending forms:', error);
    }
  };

  const AddPendingForm = async (newPendingForm) => {
    const token = localStorage.getItem('adminToken');
    const { serverUrl } = getConfig();
    const response = await fetch(`${serverUrl}/api/pending-forms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newPendingForm)
    });

    if (response.ok) {
      const newForm = await response.json();
      setPendingForms(prev => [...prev, newForm]);
    }
  };

  const handleFormDelete = async (formId) => {
    try {
      const { serverUrl } = getConfig();
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${serverUrl}/api/forms/${formId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setForms(prevForms => prevForms.filter(form => form.id !== formId));
      }
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  };

  const handleDeletePendingForm = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      const { serverUrl } = getConfig();
      const response = await fetch(`${serverUrl}/api/pending-forms/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        setPendingForms(prev => prev.filter(form => form.id !== id));
      }
    } catch (error) {
      console.error('Error deleting pending form:', error);
    }
  };

  const handleUpdateColumn = async (formId, columnId) => {
    try {
      const { serverUrl } = getConfig();
      const token = localStorage.getItem('adminToken');
      if (!token) {
        handleLogout();
        return;
      }

      const response = await fetch(`${serverUrl}/api/forms/${formId}/column`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ columnId })
      });

      if (response.status === 401) {
        const data = await response.json();
        const { serverUrl } = getConfig();
        if (data.code === 'TOKEN_EXPIRED') {
          // Try to refresh the token
          const refreshResponse = await fetch(`${serverUrl}/api/admin/refresh-token`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (refreshResponse.ok) {
            const { token: newToken } = await refreshResponse.json();
            localStorage.setItem('adminToken', newToken);
            // Retry the original request with new token
            return handleUpdateColumn(formId, columnId);
          }
        }
        // If refresh failed or token is invalid, redirect to login
        handleLogout();
        return;
      }

      if (response.ok) {
        setForms(prevForms =>
          prevForms.map(form =>
            form.id === formId ? { ...form, columnId } : form
          )
        );
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Error updating column:', error);
      handleLogout();
    }
  };

  const handleUpdatePunishment = async (formId, punishment) => {
    try {
      const { serverUrl } = getConfig();
      const token = localStorage.getItem('adminToken');
      if (!token) {
        handleLogout();
        return;
      }

      const response = await fetch(`${serverUrl}/api/forms/${formId}/punishment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ punishment })
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.ok) {
        setForms(prevForms =>
          prevForms.map(form =>
            form.id === formId ? { ...form, punishment } : form
          )
        );
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Error updating punishment:', error);
      handleLogout();
    }
  };

  const handleMergePendingForm = async (formId, pendingFormId) => {
    try {
      const { serverUrl } = getConfig();
      const token = localStorage.getItem('adminToken');
      if (!token) {
        handleLogout();
        return;
      }
      const response = await fetch(`${serverUrl}/api/merge/form/${formId}/pending/${pendingFormId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (response.ok) {
        const newForms = forms.map(form =>
          form.id === formId ? {
            ...form,
            connectedPendingForm: pendingForms.find(item => item.id === pendingFormId)
          } : form
        )
        setForms(newForms);
        setPendingForms(prevForms => prevForms.filter(item => item.id !== pendingFormId))
        return newForms
      } else {
        console.error("failed merging with pending form", response)
      }
    } catch (error) {
      console.error('Error updating punishment:', error);
    }
  };

  const handleUnmergePendingForm = async (formId) => {
    try {
      const { serverUrl } = getConfig();
      const token = localStorage.getItem('adminToken');
      if (!token) {
        handleLogout();
        return;
      }

      const response = await fetch(`${serverUrl}/api/unmerge/form/${formId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const newPendingForm = data.pendingForm;

        // Remove the connectedPendingForm from the form
        const updatedForms = forms.map(form =>
          form.id === formId ? { ...form, connectedPendingForm: null } : form
        );

        setForms(updatedForms);
        setPendingForms(prev => [...prev, newPendingForm]); // add it back to the list

        return newPendingForm;
      } else {
        console.error("Failed unmerging pending form", response);
      }
    } catch (error) {
      console.error("Error unmerging pending form:", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const { serverUrl } = getConfig();
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${serverUrl}/api/groups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFormGroups(data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };


  const createGroup = async (groupData) => {
    try {
      const { serverUrl } = getConfig();
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${serverUrl}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(groupData)
      });
      if (response.ok) {
        const newGroup = await response.json();
        setFormGroups(prev => [...prev, newGroup]);
        return newGroup;
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };


  const updateGroup = async (id, updatedData) => {
    try {
      const { serverUrl } = getConfig();
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${serverUrl}/api/groups/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });
      if (response.ok) {
        setFormGroups(prev => prev.map(g => g.id === id ? { ...g, ...updatedData } : g));
      }
    } catch (error) {
      console.error('Error updating group:', error);
    }
  };


  const deleteGroup = async (id) => {
    try {
      const { serverUrl } = getConfig();
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${serverUrl}/api/groups/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setFormGroups(prev => prev.filter(g => g.id !== id));
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };


  const addFormToGroup = async (groupId, formId) => {
    try {
      const { serverUrl } = getConfig();
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${serverUrl}/api/groups/${groupId}/forms/${formId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        await fetchGroups(); // refresh groups list
      }
    } catch (error) {
      console.error('Error adding form to group:', error);
    }
  };


  const removeFormFromGroup = async (groupId, formId) => {
    try {
      const { serverUrl } = getConfig();
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${serverUrl}/api/groups/${groupId}/forms/${formId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        await fetchGroups(); // refresh groups list
      }
    } catch (error) {
      console.error('Error removing form from group:', error);
    }
  };


  const handleUpdateGroupColumn = async (groupId, columnId) => {
    try {
      const { serverUrl } = getConfig();
      const token = localStorage.getItem('adminToken');
      if (!token) {
        handleLogout();
        return;
      }

      const response = await fetch(`${serverUrl}/api/groups/${groupId}/column`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ columnId })
      });

      if (response.status === 401) {
        const data = await response.json();
        if (data.code === 'TOKEN_EXPIRED') {
          // Try to refresh the token
          const refreshResponse = await fetch(`${serverUrl}/api/admin/refresh-token`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (refreshResponse.ok) {
            const { token: newToken } = await refreshResponse.json();
            localStorage.setItem('adminToken', newToken);
            // Retry the original request with new token
            return handleUpdateGroupColumn(groupId, columnId);
          }
        }
      }
      if (response.ok) {
        setFormGroups(prevFormGroups =>
          prevFormGroups.map(group =>
            group.id === groupId ? { ...group, columnId } : group
          )
        );
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Error updating column:', error);
      handleLogout();
    }
  };


  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        forms,
        columns,
        setForms,
        pendingForms,
        loginError,
        handleLogin,
        handleLogout,
        handleSort,
        handleUpdateColumn,
        handleUpdatePunishment,
        AddPendingForm,
        handleDeletePendingForm,
        handleMergePendingForm,
        handleFormDelete,
        handleUnmergePendingForm,
        handleAddComment,
        fetchGroups,
        createGroup,
        updateGroup,
        deleteGroup,
        addFormToGroup,
        removeFormFromGroup,
        formGroups,
        handleUpdateGroupColumn
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 