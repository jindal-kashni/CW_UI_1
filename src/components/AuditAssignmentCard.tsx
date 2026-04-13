import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/src/theme';
import type { AuditAssignment } from '@/src/types/models';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { StatusBadge } from './StatusBadge';
import { Button } from './Button';

function badgeTone(status: AuditAssignment['status']) {
  if (status === 'Completed' || status === 'Submitted') return 'good';
  if (status === 'DraftSaved' || status === 'InProgress') return 'info';
  return 'neutral';
}

function statusLabel(status: AuditAssignment['status']) {
  if (status === 'DraftSaved') return 'Draft saved';
  if (status === 'InProgress') return 'In progress';
  return status;
}

export function AuditAssignmentCard({
  item,
  onStart,
  onSaveDraft,
  showStatusBadge = true,
  showSaveDraft = true,
  primaryLabel,
  primaryHalfRight = false,
  showActions = true,
  onPress,
}: {
  item: AuditAssignment;
  onStart?: () => void;
  onSaveDraft?: () => void;
  showStatusBadge?: boolean;
  showSaveDraft?: boolean;
  primaryLabel?: string;
  primaryHalfRight?: boolean;
  showActions?: boolean;
  onPress?: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [{ opacity: pressed ? 0.98 : 1 }]}>
      <Card style={{ padding: t.spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.lg }}>
          <View style={{ flex: 1 }}>
            <Text style={[t.text.title, { fontSize: 18, lineHeight: 24 }]}>{item.title}</Text>
            <Text style={[t.text.caption, { marginTop: t.spacing.xs }]}>
              Due {new Date(item.dueAt).toLocaleDateString()}
            </Text>
            <View style={{ height: t.spacing.md }} />
            <Text style={t.text.bodyMuted}>{item.summary}</Text>
          </View>
          {showStatusBadge ? <StatusBadge label={statusLabel(item.status)} tone={badgeTone(item.status)} /> : null}
        </View>

        <View style={{ height: t.spacing.lg }} />
        <ProgressBar value={item.progressPct} />
        <Text style={[t.text.caption, { marginTop: t.spacing.xs }]}>
          {item.progressPct}% complete
        </Text>

        {showActions ? (
          <>
            <View style={{ height: t.spacing.lg }} />
            <View
              style={{
                flexDirection: 'row',
                gap: t.spacing.md,
                justifyContent: primaryHalfRight ? 'flex-end' : 'flex-start',
              }}>
              <Button
                label={primaryLabel ?? (item.status === 'Assigned' ? 'Start condition report' : 'Resume')}
                onPress={onStart}
                style={primaryHalfRight ? { width: '48%' } : { flex: 1 }}
              />
              {showSaveDraft ? (
                <Button
                  label="Save draft"
                  variant="secondary"
                  onPress={onSaveDraft}
                  style={{ flex: 1 }}
                />
              ) : null}
            </View>
          </>
        ) : null}
      </Card>
    </Pressable>
  );
}

