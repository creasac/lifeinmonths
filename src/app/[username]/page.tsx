"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AuthModal } from "@/components/AuthModal";
import { LifeGrid } from "@/components/LifeGrid";
import { CellDataMap } from "@/lib/types";
import { calculateMonthsLived } from "@/lib/utils";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user, loading: authLoading } = useAuth();
  
  // Profile data state
  const [profileData, setProfileData] = useState<{
    username: string;
    dateOfBirth: string | null;
    cellData: CellDataMap;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);
  
  // Local state for editing (only used if owner)
  const [cellData, setCellData] = useState<CellDataMap>({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // UI state for saving
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const expectedLifeYears = 80;
  
  // Check if current user is the owner of this profile
  const isOwner = user && profileData && user.username === profileData.username;
  
  // Compute labeled sections from cellData with first month for sorting
  const labeledSections = useMemo(() => {
    const data = isOwner ? cellData : (profileData?.cellData || {});
    const sections = new Map<string, { color: string; count: number; firstMonthIndex: number }>();
    Object.entries(data).forEach(([key, cell]) => {
      if (cell.label) {
        const [month, year] = key.split('-').map(Number);
        const monthIndex = year * 12 + month;
        
        const existing = sections.get(cell.label);
        if (existing) {
          existing.count++;
          existing.firstMonthIndex = Math.min(existing.firstMonthIndex, monthIndex);
        } else {
          sections.set(cell.label, { color: cell.color, count: 1, firstMonthIndex: monthIndex });
        }
      }
    });
    return sections;
  }, [isOwner, cellData, profileData?.cellData]);

  // Sort labeled sections by first month index
  const sortedLabeledSections = useMemo(() => {
    return Array.from(labeledSections.entries()).sort((a, b) => a[1].firstMonthIndex - b[1].firstMonthIndex);
  }, [labeledSections]);

  // Fetch profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/profile/${encodeURIComponent(username)}`);
        if (res.status === 404) {
          setNotFoundError(true);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await res.json();
        setProfileData(data);
        setCellData(data.cellData || {});
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setNotFoundError(true);
      } finally {
        setLoading(false);
      }
    }
    
    if (username) {
      fetchProfile();
    }
  }, [username]);

  // Save data function (only for owner)
  const saveData = useCallback(async () => {
    if (!user || !isOwner) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/life-data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cellData,
        }),
      });

      if (res.ok) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  }, [user, isOwner, cellData]);

  // Auto-save when data changes (debounced)
  useEffect(() => {
    if (!isOwner || !hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      saveData();
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOwner, hasUnsavedChanges, saveData]);

  const handleCellDataChange = (newCellData: CellDataMap) => {
    setCellData(newCellData);
    if (isOwner) setHasUnsavedChanges(true);
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not found state
  if (notFoundError || !profileData) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">User not found</h1>
        <p className="text-gray-600">The user @{username} doesn&apos;t exist.</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Go back home
        </Link>
      </div>
    );
  }

  // Calculate months
  const dateOfBirth = profileData.dateOfBirth;
  const monthsLived = dateOfBirth
    ? calculateMonthsLived(new Date(dateOfBirth))
    : 0;
  const totalMonths = expectedLifeYears * 12;
  const monthsToLive = Math.max(0, totalMonths - monthsLived);

  // Use local cellData if owner, otherwise use profile data
  const displayCellData = isOwner ? cellData : profileData.cellData;

  // Icons
  const SettingsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600">
              Life in Months
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700">@{profileData.username}</span>
            {isOwner && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">You</span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {isOwner ? (
              <>
                {isSaving && <span className="text-sm text-gray-500">Saving...</span>}
                {lastSaved && !isSaving && <span className="text-sm text-gray-400">Saved</span>}
                <Link
                  href="/settings"
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  title="Settings"
                >
                  <SettingsIcon />
                </Link>
              </>
            ) : user ? (
              <Link
                href={`/${user.username}`}
                className="text-sm text-blue-600 hover:underline"
              >
                View your profile
              </Link>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Login / Sign up
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 py-4 overflow-x-auto">
        {/* Grid and stats layout */}
        <div className="flex flex-col gap-4">
          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full border border-gray-700"></div>
              <span className="text-gray-700 text-sm">
                Lived <span className="font-medium text-red-600">{monthsLived.toLocaleString()}</span> months
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-gray-700 rounded-full bg-white"></div>
              <span className="text-gray-700 text-sm">
                Remaining <span className="font-medium text-gray-900">{monthsToLive.toLocaleString()}</span> months
              </span>
            </div>

            {/* Life Sections - sorted by date */}
            {sortedLabeledSections.length > 0 && (
              <>
                <div className="h-4 border-l border-gray-300"></div>
                {sortedLabeledSections.map(([label, { color, count }]) => (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-700"
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="text-gray-700 text-sm">
                      {label} <span className="text-gray-400">({count}m)</span>
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Life Grid */}
          <div className="flex-shrink-0">
            <LifeGrid
              expectedLifeYears={expectedLifeYears}
              dateOfBirth={dateOfBirth || null}
              cellData={displayCellData}
              onCellDataChange={handleCellDataChange}
              isEditable={isOwner || false}
            />
          </div>

          {/* Viewing notice for non-owners */}
          {!isOwner && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Viewing @{profileData.username}&apos;s life in months
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
