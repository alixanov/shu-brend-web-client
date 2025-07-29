import { apiSlice } from "./api.service";

// `saleApi` xizmatini yaratamiz va endpointlarni qo'shamiz
export const saleApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    recordSale: builder.mutation({
      query: (sale) => ({
        url: "/sales",
        method: "POST",
        body: sale,
      }),
      invalidatesTags: ["Sales", "Debtor"],
    }),
    getSalesHistory: builder.query({
      query: () => ({
        url: "/sales",
        method: "GET",
      }),
      providesTags: ["Sales", "Debtor"],
    }),
    getSalesStats: builder.query({
      query: () => ({
        url: "/stat/year",
        method: "GET",
      }),
      providesTags: ["Sales", "Debtor"],
    }),
    deleteSale: builder.mutation({
      query: (id) => ({
        url: `/sales/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Sales", "Debtor"],
    }),
  }),
});

export const {
  useRecordSaleMutation,
  useGetSalesHistoryQuery,
  useGetSalesStatsQuery,
  useDeleteSaleMutation, // ✅ DELETE hook'ini export qilamiz
} = saleApi;
