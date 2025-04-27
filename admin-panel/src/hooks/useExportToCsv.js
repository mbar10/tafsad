import { formatDateTime } from "../utils/transform";

export const useExportToCsv = (forms, columns) => {
    const exportToCSV = () => {
        const headers = ['שם', 'מפקד', 'תיאור אירוע', 'תאריך', 'עמודה', 'עונש'];
        const csvContent = [
          headers.join(','),
          ...forms.map(form => [
            form.name,
            form.commander,
            form.eventDescription,
            formatDateTime(form.date),
            columns.find(col => col.id === form.columnId)?.title || '',
            form.punishment || ''
          ].map(field => `"${field}"`).join(','))
        ].join('\n');
    
        // Add BOM for Hebrew characters
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'forms.csv';
        link.click();
      };
      return {exportToCSV}
}