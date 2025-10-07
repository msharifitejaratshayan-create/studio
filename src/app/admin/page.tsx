"use client";

import React, { useState, useEffect, FormEvent, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createUser, getUsers, User } from '@/lib/api';
import { Loader2, UserPlus, Users, LogOut } from 'lucide-react';
import { AuthContext } from '@/context/AuthContext';

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);
  const { toast } = useToast();
  const authContext = useContext(AuthContext);

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
    fetchUsers();
  }, []);

  const handleLogout = () => {
    authContext?.logout();
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
