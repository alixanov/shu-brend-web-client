import { apiSlice } from "./api.service";

export const nasiyaApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getNasiya: builder.query({
            query: () => ({
                url: "/nasiya/get",
                method: "GET",
            }),
            providesTags: ["Nasiya"]
        }),
        createNasiya: builder.mutation({
            query: (nasiyaData) => ({
                url: "/nasiya/create",
                method: "POST",
                body: nasiyaData,
            }),
            invalidatesTags: ["Nasiya"]

        }),
        completeNasiya: builder.mutation({
            query: ({ id, payment_method, sell_price }) => ({
                url: `/nasiya/complete/${id}`,
                method: "POST",
                body: { payment_method, sell_price },
            }),
            invalidatesTags: ["Nasiya"]

        }),
    }),
});

export const { useGetNasiyaQuery, useCreateNasiyaMutation, useCompleteNasiyaMutation } = nasiyaApi;
