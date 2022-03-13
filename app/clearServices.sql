delete from T_Parking;
delete from T_ModePayment;
delete from T_Service;
update T_Place set occupee=0 where occupee=1;
