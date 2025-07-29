import { apiSlice } from "./api.service";

// `debtorApi` xizmatini yaratamiz va endpointlarni qo'shamiz
export const debtorApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createDebtor: builder.mutation({
      query: (debtor) => ({
        url: "/debtors",
        method: "POST",
        body: debtor,
      }),
      invalidatesTags: ["Debtor", "Sales"],
    }),
    returnProductDebtor: builder.mutation({
      query: (body) => ({
        url: "/debtors/return",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Debtor", "Sales"],
    }),
    getDebtors: builder.query({
      query: () => ({
        url: "/debtors",
        method: "GET",
      }),
      providesTags: ["Debtor", "Sales"]
    }),
    updateDebtor: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/debtors/${id}`, // To'g'ri URL
        method: "PUT",
        body, // Faqat kerakli ma'lumotlar yuboriladi
      }),
      invalidatesTags: ["Debtor", "Sales"], 
    }),
    editDebtor: builder.mutation({
      query: ({ id, body }) => ({
        url: `/debtor/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Debtor", "Sales"], // Tag qo'shamiz, bu orqali ma'lumotlarni yangilash mumkin bo'ladi
    }),
    createPayment: builder.mutation({
      query: (body) => ({
        url: `/pay/debtor`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Debtor", "Sales"], // Tag qo'shamiz, bu orqali ma'lumotlarni yangilash mumkin bo'ladi
    }),
    deleteDebtor: builder.mutation({
      query: (id) => ({
        url: `/debtors/${id}`,
        method: "DELETE",
      }),
    }),
    invalidatesTags: ["Debtor", "Sales"],
  }),
});

export const {
  useCreateDebtorMutation,
  useGetDebtorsQuery,
  useUpdateDebtorMutation,
  useDeleteDebtorMutation,
  useReturnProductDebtorMutation,
  useEditDebtorMutation,
  useCreatePaymentMutation
} = debtorApi;
