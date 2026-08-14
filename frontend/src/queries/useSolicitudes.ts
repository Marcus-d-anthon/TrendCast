import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { solicitudesApi, type CrearSolicitudInput, type ListarSolicitudesParams } from '../api/endpoints/solicitudes';
import { queryKeys } from './query-keys';

export function useSolicitudes(params: ListarSolicitudesParams = {}) {
  return useQuery({ queryKey: queryKeys.solicitudes(params), queryFn: () => solicitudesApi.listar(params) });
}

export function useCrearSolicitud() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearSolicitudInput) => solicitudesApi.crear(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['solicitudes'] }),
  });
}

export function useAprobarSolicitud() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => solicitudesApi.aprobar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['solicitudes'] }),
  });
}

export function useRechazarSolicitud() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) => solicitudesApi.rechazar(id, motivo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['solicitudes'] }),
  });
}

// Efectuar genera un movimiento de inventario real (ENTRADA/SALIDA) -- misma
// invalidacion que useConfirmarCompra/useRegistrarMovimiento: afecta stock,
// alertas y el reporte de existencias ademas de la lista de solicitudes.
export function useEfectuarSolicitud() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => solicitudesApi.efectuar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.productos });
      queryClient.invalidateQueries({ queryKey: queryKeys.alertas });
      queryClient.invalidateQueries({ queryKey: queryKeys.reportesExistencias });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
    },
  });
}
