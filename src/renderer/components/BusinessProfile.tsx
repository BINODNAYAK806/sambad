import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, Save, Building2, XCircle } from 'lucide-react';

const BUSINESS_TYPES = ['Retail', 'Wholesale', 'Service', 'Manufacturing'];
const BUSINESS_CATEGORIES = ['Electronics', 'Clothing', 'Food & Beverage', 'Healthcare', 'Education'];

export function BusinessProfile() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        business_name: '',
        phone_number: '',
        gstin: '',
        email_id: '',
        business_type: '',
        business_category: '',
        state: '',
        pincode: '',
        address: '',
        logo_path: '', // Stores Base64 string
        signature_path: '' // Stores Base64 string
    });

    const [customType, setCustomType] = useState(false);
    const [customCategory, setCustomCategory] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const res = await window.electronAPI.profile.get();
            if (res.success && res.data) {
                const data = res.data;
                setFormData(prev => ({ ...prev, ...data }));

                // Check if loaded values are custom
                if (data.business_type && !BUSINESS_TYPES.map(t => t.toLowerCase()).includes(data.business_type.toLowerCase())) {
                    setCustomType(true);
                }
                if (data.business_category && !BUSINESS_CATEGORIES.map(c => c.toLowerCase()).includes(data.business_category.toLowerCase())) {
                    setCustomCategory(true);
                }
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Improved select change handler to manage custom interactions
    const handleSelectChange = (field: 'business_type' | 'business_category', value: string) => {
        if (value === 'other') {
            if (field === 'business_type') setCustomType(true);
            if (field === 'business_category') setCustomCategory(true);
            setFormData(prev => ({ ...prev, [field]: '' })); // Clear value for custom input
        } else {
            if (field === 'business_type') setCustomType(false);
            if (field === 'business_category') setCustomCategory(false);
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_path' | 'signature_path') => {
        const file = e.target.files?.[0];
        if (file) {
            // Limit size to 2MB to prevent DB bloating
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image size must be less than 2MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [field]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!formData.business_name) {
            toast.error('Business Name is required');
            return;
        }

        setLoading(true);
        try {
            const res = await window.electronAPI.profile.save(formData);
            if (res.success) {
                toast.success('Business Profile saved successfully');
            } else {
                toast.error(res.error || 'Failed to save profile');
            }
        } catch (error) {
            console.error('Failed to save profile:', error);
            toast.error('Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Business Profile
                </CardTitle>
                <CardDescription>Manage your business details, logo, and signature.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Logo Upload Section */}
                <div className="flex justify-center mb-6">
                    <div className="relative group cursor-pointer w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            onChange={(e) => handleFileChange(e, 'logo_path')}
                        />
                        {formData.logo_path ? (
                            <img src={formData.logo_path} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-2 text-gray-400">
                                <Upload className="w-6 h-6 mx-auto mb-1" />
                                <span className="text-xs">Add Logo</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <span className="text-xs font-medium">Change</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Business Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Business Details</h3>

                        <div className="space-y-2">
                            <Label htmlFor="business_name">Business Name *</Label>
                            <Input
                                id="business_name"
                                name="business_name"
                                value={formData.business_name}
                                onChange={handleChange}
                                placeholder="Enter Business Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone_number">Phone Number</Label>
                            <Input
                                id="phone_number"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                placeholder="Enter Phone Number"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gstin">GSTIN</Label>
                            <Input
                                id="gstin"
                                name="gstin"
                                value={formData.gstin}
                                onChange={handleChange}
                                placeholder="Enter GSTIN"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email_id">Email ID</Label>
                            <Input
                                id="email_id"
                                name="email_id"
                                value={formData.email_id}
                                onChange={handleChange}
                                placeholder="Enter Email ID"
                            />
                        </div>
                    </div>

                    {/* More Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">More Details</h3>

                        <div className="space-y-2">
                            <Label>Business Type</Label>
                            {customType ? (
                                <div className="flex gap-2">
                                    <Input
                                        name="business_type"
                                        value={formData.business_type}
                                        onChange={handleChange}
                                        placeholder="Enter Business Type"
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => setCustomType(false)} title="Select from list">
                                        <XCircle className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Select
                                    value={formData.business_type}
                                    onValueChange={(val) => handleSelectChange('business_type', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Business Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BUSINESS_TYPES.map(type => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                        <SelectItem value="other">Other (Specify)</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Business Category</Label>
                            {customCategory ? (
                                <div className="flex gap-2">
                                    <Input
                                        name="business_category"
                                        value={formData.business_category}
                                        onChange={handleChange}
                                        placeholder="Enter Business Category"
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => setCustomCategory(false)} title="Select from list">
                                        <XCircle className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Select
                                    value={formData.business_category}
                                    onValueChange={(val) => handleSelectChange('business_category', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Business Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BUSINESS_CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                        <SelectItem value="other">Other (Specify)</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                                id="state"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                placeholder="State"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pincode">Pincode</Label>
                            <Input
                                id="pincode"
                                name="pincode"
                                value={formData.pincode}
                                onChange={handleChange}
                                placeholder="Pincode"
                            />
                        </div>
                    </div>
                </div>

                {/* Address and Signature */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="address">Business Address</Label>
                        <Input
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter full address"
                            className="h-20" // Simulating textarea height if Input supports it, or just use Input
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Add Signature</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center relative hover:border-primary transition-colors cursor-pointer bg-gray-50">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                onChange={(e) => handleFileChange(e, 'signature_path')}
                            />
                            {formData.signature_path ? (
                                <img src={formData.signature_path} alt="Signature" className="h-full object-contain p-2" />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <Upload className="w-8 h-8 mx-auto mb-2" />
                                    <span className="text-sm">Upload Signature</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={loading} className="gap-2">
                        <Save className="w-4 h-4" />
                        Save Changes
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}
