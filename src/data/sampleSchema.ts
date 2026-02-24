import type { SqlSchema } from '../types/schema';

// Sample e-commerce database schema for demonstration
export const sampleSchema: SqlSchema = {
    tables: [
        {
            id: 'users',
            name: 'users',
            columns: [
                { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false },
                { name: 'email', type: 'VARCHAR(255)', nullable: false, unique: true },
                { name: 'username', type: 'VARCHAR(100)', nullable: false },
                { name: 'password', type: 'VARCHAR(255)', nullable: false },
                { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            ],
        },
        {
            id: 'products',
            name: 'products',
            columns: [
                { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false },
                { name: 'category_id', type: 'INT', isForeignKey: true, nullable: false },
                { name: 'name', type: 'VARCHAR(200)', nullable: false },
                { name: 'price', type: 'DECIMAL(10,2)', nullable: false },
                { name: 'stock', type: 'INT', nullable: false },
                { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            ],
        },
        {
            id: 'categories',
            name: 'categories',
            columns: [
                { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false },
                { name: 'name', type: 'VARCHAR(100)', nullable: false },
                { name: 'description', type: 'TEXT', nullable: true },
            ],
        },
        {
            id: 'orders',
            name: 'orders',
            columns: [
                { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false },
                { name: 'user_id', type: 'INT', isForeignKey: true, nullable: false },
                { name: 'status', type: 'ENUM', nullable: false },
                { name: 'total', type: 'DECIMAL(10,2)', nullable: false },
                { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            ],
        },
        {
            id: 'order_items',
            name: 'order_items',
            columns: [
                { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false },
                { name: 'order_id', type: 'INT', isForeignKey: true, nullable: false },
                { name: 'product_id', type: 'INT', isForeignKey: true, nullable: false },
                { name: 'quantity', type: 'INT', nullable: false },
                { name: 'unit_price', type: 'DECIMAL(10,2)', nullable: false },
            ],
        },
        {
            id: 'reviews',
            name: 'reviews',
            columns: [
                { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false },
                { name: 'user_id', type: 'INT', isForeignKey: true, nullable: false },
                { name: 'product_id', type: 'INT', isForeignKey: true, nullable: false },
                { name: 'rating', type: 'TINYINT', nullable: false },
                { name: 'body', type: 'TEXT', nullable: true },
                { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            ],
        },
    ],
    foreignKeys: [
        { fromTable: 'products', fromColumn: 'category_id', toTable: 'categories', toColumn: 'id' },
        { fromTable: 'orders', fromColumn: 'user_id', toTable: 'users', toColumn: 'id' },
        { fromTable: 'order_items', fromColumn: 'order_id', toTable: 'orders', toColumn: 'id' },
        { fromTable: 'order_items', fromColumn: 'product_id', toTable: 'products', toColumn: 'id' },
        { fromTable: 'reviews', fromColumn: 'user_id', toTable: 'users', toColumn: 'id' },
        { fromTable: 'reviews', fromColumn: 'product_id', toTable: 'products', toColumn: 'id' },
    ],
};
