import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { ParsedTransaction } from "../services/smsSync";
import { syncBankTransactionsFromSms } from "../services/smsSync";

const formatAmount = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const BankSmsTrackerScreen = () => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, item) => {
        if (item.type === "CREDIT") {
          acc.credit += item.amount;
        } else {
          acc.debit += item.amount;
        }
        return acc;
      },
      { credit: 0, debit: 0 },
    );
  }, [transactions]);

  const onSync = async () => {
    try {
      setLoading(true);

      const result = await syncBankTransactionsFromSms();

      // Required proof: encrypted string logged in console.
      console.log("Encrypted bank payload:", result.encrypted);

      setTransactions(result.transactions);

      if (!result.transactions.length) {
        Alert.alert("Sync complete", "No bank-like transactions found in the last 30 days.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sync SMS.";
      Alert.alert("Sync failed", message);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ParsedTransaction }) => {
    const isCredit = item.type === "CREDIT";

    return (
      <View style={styles.rowCard}>
        <View style={styles.rowLeft}>
          <Text style={styles.merchant}>{item.merchant}</Text>
          <Text style={styles.dateText}>{new Date(item.date).toLocaleString()}</Text>
        </View>

        <View style={styles.rowRight}>
          <Text style={[styles.typeChip, isCredit ? styles.creditChip : styles.debitChip]}>{item.type}</Text>
          <Text style={[styles.amountText, isCredit ? styles.creditText : styles.debitText]}>
            {isCredit ? "+" : "-"}
            {formatAmount(item.amount)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.headerWrap}>
        <Text style={styles.title}>Secure Expense Sync</Text>
        <Text style={styles.subtitle}>Zero knowledge local SMS parsing (Android)</Text>
      </View>

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Debits</Text>
          <Text style={styles.debitText}>{formatAmount(totals.debit)}</Text>
        </View>
        <View>
          <Text style={styles.summaryLabel}>Credits</Text>
          <Text style={styles.creditText}>{formatAmount(totals.credit)}</Text>
        </View>
      </View>

      <TouchableOpacity disabled={loading} onPress={onSync} style={[styles.syncButton, loading && styles.syncButtonDisabled]}>
        {loading ? <ActivityIndicator color="#0B0E11" /> : <Text style={styles.syncButtonText}>Sync Bank Data</Text>}
      </TouchableOpacity>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No synced data yet</Text>
            <Text style={styles.emptySubtitle}>Tap “Sync Bank Data” to parse the last 30 days of bank SMS.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0E11",
    paddingHorizontal: 16,
  },
  headerWrap: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    color: "#F4F6F8",
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#98A2B3",
    fontSize: 13,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: "#12171D",
    borderWidth: 1,
    borderColor: "#1D2939",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    color: "#98A2B3",
    fontSize: 12,
    marginBottom: 4,
  },
  syncButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FDB022",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  syncButtonDisabled: {
    opacity: 0.7,
  },
  syncButtonText: {
    color: "#0B0E11",
    fontWeight: "700",
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 24,
    gap: 10,
  },
  rowCard: {
    backgroundColor: "#12171D",
    borderWidth: 1,
    borderColor: "#1D2939",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLeft: {
    flex: 1,
    marginRight: 12,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  merchant: {
    color: "#F4F6F8",
    fontSize: 15,
    fontWeight: "600",
  },
  dateText: {
    color: "#98A2B3",
    fontSize: 12,
    marginTop: 2,
  },
  typeChip: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  creditChip: {
    color: "#17B26A",
    backgroundColor: "#062E1D",
  },
  debitChip: {
    color: "#F97066",
    backgroundColor: "#3C1212",
  },
  amountText: {
    fontSize: 14,
    fontWeight: "700",
  },
  creditText: {
    color: "#17B26A",
  },
  debitText: {
    color: "#F97066",
  },
  emptyState: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emptyTitle: {
    color: "#F4F6F8",
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtitle: {
    marginTop: 6,
    color: "#98A2B3",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
  },
});

export default BankSmsTrackerScreen;
