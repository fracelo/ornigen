import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1e293b', backgroundColor: '#FFFFFF' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, paddingBottom: 10 },
  logo: { width: 45, height: 45, objectFit: 'contain' },
  companyName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', flex: 1, color: '#0f172a' },
  titleSection: { borderTop: 1, borderTopColor: '#e2e8f0', paddingTop: 10, marginBottom: 20 },
  reportTitle: { fontSize: 18, textAlign: 'center', fontWeight: 'bold', marginBottom: 5 },
  metaInfo: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#64748b' },
  table: { display: 'flex', width: 'auto', marginTop: 10 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 8, alignItems: 'center' },
  tableHeader: { backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 'bold' },
  rowEven: { backgroundColor: '#ffffff' },
  rowOdd: { backgroundColor: '#f8fafc' },
  colNome: { width: '75%', paddingLeft: 10 },
  colSaldo: { width: '25%', textAlign: 'right', paddingRight: 15 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#cbd5e1', paddingTop: 10, textAlign: 'center' },
  pageNumber: { fontSize: 9, color: '#94a3b8' }
});

interface RelatorioProps {
  dados: any[];
  empresa: string; // 🔹 Recebe string garantida pela page.tsx
  filtros: {
    dataInicio?: string;
    dataFim?: string;
  };
}

export const RelatorioSaldosPDF = ({ dados, empresa, filtros }: RelatorioProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.headerContainer}>
        <Image src="/icons/logo_empresa.png" style={styles.logo} />
        <Text style={styles.companyName}>{empresa}</Text>
        <Image src="/icons/logo_empresa.png" style={styles.logo} />
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.reportTitle}>Saldos de Estoque</Text>
        <View style={styles.metaInfo}>
          <Text>Data de Geração: {new Date().toLocaleString('pt-BR')}</Text>
          {filtros.dataInicio && (
            <Text>Período: {filtros.dataInicio} a {filtros.dataFim}</Text>
          )}
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.colNome}>PRODUTO / MARCA</Text>
          <Text style={styles.colSaldo}>SALDO ATUAL</Text>
        </View>

        {dados.map((item, index) => (
          <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]} wrap={false}>
            <Text style={styles.colNome}>{item.nome} {item.marca ? `(${item.marca})` : ''}</Text>
            <Text style={[styles.colSaldo, { fontWeight: 'bold' }]}>
              {Number(item.estoque_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 3 })} {item.unidade_medida}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Página ${pageNumber} de ${totalPages}`
        )} />
      </View>
    </Page>
  </Document>
);