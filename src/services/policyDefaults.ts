import type { CompanyData } from './models';

export const getDefaultPrivacyPolicy = (data: Partial<CompanyData>) => {
  const nombre = data.nombreEmpresa || '[Empresa]';
  const cif = data.cifNif || '[NIF/CIF]';
  const direccion = data.direccion || '[Dirección]';

  return `POLÍTICA DE PRIVACIDAD

En nombre de la empresa ${nombre} con NIF/CIF ${cif}, con dirección comercial en ${direccion}, le informamos de que tratamos la información que nos facilita con el fin de prestarles el servicio de reservas de citas y gestión comercial.

Los datos proporcionados se conservarán mientras se mantenga la relación comercial o durante los años necesarios para cumplir con las obligaciones legales. Los datos no se cederán a terceros salvo en los casos en que exista una obligación legal.

Usted tiene derecho a obtener confirmación sobre si en ${nombre} estamos tratando sus datos personales por tanto tiene derecho a acceder a sus datos personales, rectificar los datos inexactos o solicitar su supresión cuando los datos ya no sean necesarios escribiendo directamente a los administradores.`;
};

export const getDefaultTermsOfUse = (data: Partial<CompanyData>) => {
  const nombre = data.nombreEmpresa || '[Empresa]';

  return `CONDICIONES DE USO

El uso del servicio de la plataforma instalada bajo ${nombre} está sujeto a la aceptación explícita de los siguientes términos y condiciones:

1. OBLIGACIONES DEL USUARIO
El usuario se compromete a usar las utilidades del software de manera adecuada para la gestión de citas de forma leal, no sobrecargando intencionadamente los recursos de red y presentando datos de contacto válidos.

2. CANCELACIONES DE CITAS
Las cancelaciones de las citas se deben notificar siguiendo las reglas propias de la agenda. ${nombre} no se hace responsable de daños causados por fallos del sistema o inasistencias derivadas de fuerza mayor.

3. EXCLUSIÓN DE RESPONSABILIDAD
El desarrollador del sistema no será en ningún caso responsable del lucro cesante o daño emergente asociado a un mal uso del motor de citas. Limitamos nuestra competencia al mantenimiento lógico de la plataforma bajo el servicio "Software as a Service".`;
};
