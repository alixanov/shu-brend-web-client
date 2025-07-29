import { apiSlice } from "./api.service";

// `saleApi` xizmatini yaratamiz va endpointlarni qo'shamiz
export const saleApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🟢 Sotuvni yozish
    recordSale: builder.mutation({
      query: (sale) => ({
        url: "/sales",
        method: "POST",
        body: sale,
      }),
      invalidatesTags: ["Sales"],
    }),

    // 🟢 Sotuv tarixini olish
    getSalesHistory: builder.query({
      query: () => ({
        url: "/sales",
        method: "GET",
      }),
      providesTags: ["Sales"],
    }),

    // 🟢 Sotuvni o‘chirish
    deleteSale: builder.mutation({
      query: (id) => ({
        url: `/sales/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Sales"],
    }),
  }),
});

export const {
  useRecordSaleMutation,
  useGetSalesHistoryQuery,
  useDeleteSaleMutation, // ✅ Qo‘shilgan hook
} = saleApi;
