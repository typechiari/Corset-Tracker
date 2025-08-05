"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import ButtonAccount from "@/components/ButtonAccount";

export default function ConfigEscoliosis() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    initial_degrees: "",
    estimated_improvement_per_month: "1.0",
    goal_hours_per_day: "15"
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Insertar o actualizar configuración del usuario
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          initial_degrees: parseFloat(formData.initial_degrees),
          estimated_improvement_per_month: parseFloat(formData.estimated_improvement_per_month),
          goal_hours_per_day: parseFloat(formData.goal_hours_per_day)
        });

      if (error) throw error;

      // Redirigir al dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar la configuración. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <section className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-base-content mb-2">
            Corset Tracker
          </h1>
          <p className="text-base-content/70">
            Configuración inicial para comenzar tu seguimiento
          </p>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información de Escoliosis */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-base-content border-b border-gray-700 pb-2 text-center">
                 ⚙️ Configuración de Escoliosis 
                </h2>
                
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Grados iniciales de Escoliosis</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="initial_degrees"
                      value={formData.initial_degrees}
                      onChange={handleInputChange}
                      placeholder="35.0"
                      className="input input-bordered w-full"
                      required
                    />
                    <label className="label">
                      <span className="label-text-alt">Grados actuales de tu escoliosis</span>
                    </label>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Mejora estimada por mes</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="estimated_improvement_per_month"
                      value={formData.estimated_improvement_per_month}
                      onChange={handleInputChange}
                      placeholder="1.0"
                      className="input input-bordered w-full"
                      required
                    />
                    <label className="label">
                      <span className="label-text-alt">Grados que esperas mejorar cada mes</span>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Horas objetivo por día</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      name="goal_hours_per_day"
                      value={formData.goal_hours_per_day}
                      onChange={handleInputChange}
                      placeholder="15"
                      className="input input-bordered w-full"
                      required
                    />
                    <label className="label">
                      <span className="label-text-alt">Horas que planeas usar el corset diariamente</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Botón de Envío */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full btn-lg font-bold"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Guardando...
                    </>
                  ) : (
                    'Comenzar Seguimiento'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
