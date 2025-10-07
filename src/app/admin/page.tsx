"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createUser, getUsers, User } from '@/lib/api';
import { Loader2, UserPlus, Users, LogIn, LogOut } from 'lucide-react';

// Hardcoded credentials for admin access
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'kX3ZyTAUNl4Cvkj8mftnYVozg7VOn8tMH9nV0pqJ';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsFetchingUsers(true);
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to fetch users',
        description: error.message || 'Could not retrieve user list from the server.',
      });
    } finally {
      setIsFetchingUsers(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (loginUsername === ADMIN_USERNAME && loginPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError('');
      setLoginUsername('');
      setLoginPassword('');
    } else {
      setLoginError('Invalid username or password.');
      setIsAuthenticated(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newUser = await createUser(newUsername, newPassword);
      toast({
        title: 'User Created',
        description: `User "${newUser.username}" has been successfully created.`,
      });
      setNewUsername('');
      setNewPassword('');
      await fetchUsers(); // Refresh user list
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error creating user',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="flex justify-center items-center min-h-screen p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn /> Admin Login
            </CardTitle>
            <CardDescription>Please enter your credentials to access the admin panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">Username</Label>
                <Input
                  id="login-username"
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {loginError && (
                <p className="text-sm font-medium text-destructive">{loginError}</p>
              )}
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto grid gap-8">
        <div className="flex justify-between items-center">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Admin Panel</h1>
                <p className="text-muted-foreground">Manage users for your application.</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2" /> Logout
            </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus /> Create New User
                </CardTitle>
                <CardDescription>Add a new user to the database.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="e.g., john.doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter a secure password"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 animate-spin" />}
                    Create User
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users /> Existing Users
                </CardTitle>
                <CardDescription>List of all users in the database.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="border rounded-md max-h-96 overflow-y-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted">
                            <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Username</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isFetchingUsers ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-24 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader2 className="animate-spin text-muted-foreground" />
                                            <span>Loading users...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : users.length > 0 ? (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                    <TableCell className="font-mono text-xs">{user.id}</TableCell>
                                    <TableCell>{user.username}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                    No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                 </div>
                 <div className="text-right mt-2">
                    <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isFetchingUsers}>
                        Refresh List
                    </Button>
                 </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </main>
  );
}
