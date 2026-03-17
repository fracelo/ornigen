import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#1e293b', backgroundColor: '#FFFFFF' },
  // Cabeçalho Padronizado: Logo - Nome - Logo
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, paddingBottom: 10 },
  logo: { width: 45, height: 45, objectFit: 'contain' },
  companyName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', flex: 1, color: '#0f172a' },
  
  titleSection: { borderTop: 1, borderTopColor: '#e2e8f0', paddingTop: 10, marginBottom: 20 },
  reportTitle: { fontSize: 16, textAlign: 'center', fontWeight: 'bold', marginBottom: 5 },
  metaInfo: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#64748b' },
  
  table: { display: 'flex', width: 'auto', marginTop: 10 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 8, alignItems: 'center' },
  tableHeader: { backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 'bold' },
  rowEven: { backgroundColor: '#ffffff' },
  rowOdd: { backgroundColor: '#f8fafc' },
  
  colData: { width: '15%', paddingLeft: 5 },
  colProd: { width: '40%' },
  colTipo: { width: '15%', textAlign: 'center' },
  colQtd: { width: '15%', textAlign: 'right' },
  colMotivo: { width: '15%', textAlign: 'right', paddingRight: 5 },
  
  tipoE: { color: '#16a34a', fontWeight: 'bold' }, 
  tipoS: { color: '#dc2626', fontWeight: 'bold' },
  
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#cbd5e1', paddingTop: 10, textAlign: 'center' },
  pageNumber: { fontSize: 9, color: '#94a3b8' }
});

interface RelatorioMovProps {
  dados: any[];
  empresa: string;
  filtros: { dataInicio: string; dataFim: string; };
}

export const RelatorioMovimentoPDF = ({ dados, empresa, filtros }: RelatorioMovProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.headerContainer}>
        <Image src="/icons/logo_empresa.png" style={styles.logo} />
        <Text style={styles.companyName}>{empresa}</Text>
        <Image src="/icons/logo_empresa.png" style={styles.logo} />
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.reportTitle}>Movimentação de Estoque Detalhada</Text>
        <View style={styles.metaInfo}>
          <Text>Período: {filtros.dataInicio.split('-').reverse().join('/')} a {filtros.dataFim.split('-').reverse().join('/')}</Text>
          <Text>Emissão: {new Date().toLocaleString('pt-BR')}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.colData}>DATA</Text>
          <Text style={styles.colProd}>PRODUTO</Text>
          <Text style={styles.colTipo}>OPERAÇÃO</Text>
          <Text style={styles.colQtd}>QTD</Text>
          <Text style={styles.colMotivo}>SUBTIPO</Text>
        </View>

        {dados.map((mov, index) => (
          <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]} wrap={false}>
            <Text style={styles.colData}>{new Date(mov.created_at).toLocaleDateString('pt-BR')}</Text>
            <Text style={styles.colProd}>{mov.alimentos?.nome || 'N/A'}</Text>
            <Text style={[styles.colTipo, mov.tipo === 'E' ? styles.tipoE : styles.tipoS]}>
              {mov.tipo === 'E' ? 'ENTRADA' : 'SAÍDA'}
            </Text>
            <Text style={styles.colQtd}>{Number(mov.quantidade).toFixed(3)}</Text>
            <Text style={styles.colMotivo}>{mov.subtipo || '-'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
      </View>
    </Page>
  </Document>
);