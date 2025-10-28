'use client';

import { useState, useCallback, useEffect } from 'react';
import EmptyState from '@/components/EmptyState';

interface WebhookRecord {
    id: string;
    name: string;
    url: string;
    events: string[];
    status: 'active' | 'inactive';
    createdAt: string;
    lastTriggered?: string;
}

export default function WebhooksPage() {
    const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreatePanel, setShowCreatePanel] = useState(false);

    // Load webhooks
    const loadWebhooks = useCallback(async () => {
        try {
            setLoading(true);
            // Mock API call - replace with actual API endpoint
            await new Promise(resolve => setTimeout(resolve, 1000));
            setWebhooks([]);
        } catch (error) {
            console.error('Error loading webhooks:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle create webhook
    const handleCreateWebhook = useCallback(() => {
        setShowCreatePanel(true);
    }, []);

    // Load webhooks on component mount
    useEffect(() => {
        loadWebhooks();
    }, [loadWebhooks]);

    return (
        <div className="h-full bg-white">
            {loading ? (
                <div className='flex items-center justify-center h-full'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600' />
                </div>
            ) : webhooks.length === 0 ? (
                <EmptyState
                    title="No Webhooks Yet"
                    description="Create your first webhook to start receiving event notifications and trigger automated workflows."
                    imagePath="/images/Infographics/SG-no-webhooks-yet.jpg"
                    actionButton={{
                        label: "Create Webhook",
                        onClick: handleCreateWebhook
                    }}
                />
            ) : (
                <div>
                    {/* Webhooks list will go here */}
                </div>
            )}
        </div>
    );
}