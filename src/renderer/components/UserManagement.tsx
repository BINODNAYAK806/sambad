import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Shield, User as UserIcon, Trash2, Key } from 'lucide-react';
import { toast } from 'sonner';

interface User {
    id: number;
    username: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
}

export function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<'ADMIN' | 'STAFF'>('STAFF');

    // Edit User State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editUsername, setEditUsername] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [isEditOpen, setIsEditOpen] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const result = await window.electronAPI.userAuth.list();
            if (result.success) {
                setUsers(result.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async () => {
        if (!newUsername || !newPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            const result = await window.electronAPI.userAuth.create({
                username: newUsername,
                password: newPassword,
                role: newRole
            });

            if (result.success) {
                toast.success(`User ${newUsername} created successfully`);
                setIsAddUserOpen(false);
                setNewUsername('');
                setNewPassword('');
                fetchUsers();
            } else {
                toast.error(result.error || 'Failed to create user');
            }
        } catch (err) {
            toast.error('An error occurred while creating user');
        }
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;

        try {
            // Update Username if changed
            if (editUsername && editUsername !== editingUser.username) {
                const res = await window.electronAPI.userAuth.updateUsername({
                    userId: editingUser.id,
                    newUsername: editUsername
                });
                if (!res.success) {
                    toast.error(res.error || 'Failed to update username');
                    return;
                }
            }

            // Update Password if provided
            if (editPassword) {
                const res = await window.electronAPI.userAuth.updatePassword({
                    userId: editingUser.id,
                    newPassword: editPassword
                });
                if (!res.success) {
                    toast.error(res.error || 'Failed to update password');
                    return;
                }
            }

            toast.success('User updated successfully');
            setIsEditOpen(false);
            setEditingUser(null);
            fetchUsers();

        } catch (err: any) {
            toast.error(err.message || 'Failed to update user');
        }
    };

    const openEditDialog = (user: User) => {
        setEditingUser(user);
        setEditUsername(user.username);
        setEditPassword(''); // clear password field
        setIsEditOpen(true);
    };

    const handleDeleteUser = async (userId: number, username: string) => {
        if (!confirm(`Are you sure you want to delete user ${username}?`)) return;

        try {
            const res = await window.electronAPI.userAuth.delete(userId);
            if (res.success) {
                toast.success('User deleted successfully');
                fetchUsers();
            } else {
                toast.error(res.error || 'Failed to delete user');
            }
        } catch (err: any) {
            toast.error(err.message || 'An error occurred');
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN':
                return <Badge className="bg-purple-600">Super Admin</Badge>;
            case 'ADMIN':
                return <Badge className="bg-blue-600">Admin</Badge>;
            default:
                return <Badge variant="secondary">Staff</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-primary" />
                        User Management
                    </CardTitle>
                    <CardDescription>Manage local users and their access levels</CardDescription>
                </div>
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription>
                                Create a new local user with specific access rights.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Username</label>
                                <Input
                                    placeholder="john_doe"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <Select value={newRole} onValueChange={(val: any) => setNewRole(val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ADMIN">Admin (All Access)</SelectItem>
                                        <SelectItem value="STAFF">Staff (Limited Access)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddUser}>Create User</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Username</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.username}</TableCell>
                                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {user.role === 'STAFF' && (
                                            <Button variant="ghost" size="icon" title="Manage Permissions">
                                                <Shield className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditDialog(user)}
                                            className="text-muted-foreground hover:text-primary"
                                            title="Edit ID & Password"
                                        >
                                            <Key className="w-4 h-4" />
                                        </Button>
                                        {user.role !== 'SUPER_ADMIN' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDeleteUser(user.id, user.username)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            {/* Edit User Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit User Credentials</DialogTitle>
                        <DialogDescription>
                            Change username (ID) or password for {editingUser?.username}.
                            Leave password blank to keep current.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Username (ID)</label>
                            <Input
                                value={editUsername}
                                onChange={(e) => setEditUsername(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Password</label>
                            <Input
                                type="password"
                                placeholder="Leave blank to keep current"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateUser}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
