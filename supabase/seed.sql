-- Insert sample dealership leads (use a fixed dealership UUID for demo)
insert into leads (dealership_id, first_name, last_name, phone, email, vehicle_interest, last_contact_date, lead_source, status, notes) values
('00000000-0000-0000-0000-000000000001', 'Michael', 'Torres', '+15551234567', 'michael.torres@email.com', '2023 GMC Sierra 1500 Denali', '2024-01-15', 'Cars.com', 'pending', 'Interested in financing options'),
('00000000-0000-0000-0000-000000000001', 'Sarah', 'Johnson', '+15552345678', 'sarah.j@email.com', '2024 Chevrolet Silverado LTZ', '2024-01-10', 'Website', 'contacted', 'Called twice, no answer'),
('00000000-0000-0000-0000-000000000001', 'David', 'Kim', '+15553456789', 'dkim@email.com', '2023 Ford F-150 Lariat', '2024-01-08', 'Floor', 'responded', 'Replied to SMS, wants to come in'),
('00000000-0000-0000-0000-000000000001', 'Jessica', 'Martinez', '+15554567890', 'jmartinez@email.com', '2024 RAM 1500 Limited', '2024-01-05', 'AutoTrader', 'appointed', 'Appointment set for Saturday'),
('00000000-0000-0000-0000-000000000001', 'Robert', 'Chen', '+15555678901', 'rchen@email.com', '2023 Toyota Tundra TRD Pro', '2023-12-20', 'Cars.com', 'dead', 'Purchased elsewhere'),
('00000000-0000-0000-0000-000000000001', 'Amanda', 'Williams', '+15556789012', 'awilliams@email.com', '2024 Nissan Frontier Pro-4X', '2024-01-12', 'Website', 'pending', 'Budget around $35k'),
('00000000-0000-0000-0000-000000000001', 'James', 'Brown', '+15557890123', 'jbrown@email.com', '2023 Jeep Gladiator Rubicon', '2024-01-14', 'Referral', 'contacted', 'Left voicemail'),
('00000000-0000-0000-0000-000000000001', 'Emily', 'Davis', '+15558901234', 'edavis@email.com', '2024 Honda Ridgeline Black Edition', '2024-01-11', 'Website', 'pending', 'First-time buyer');
